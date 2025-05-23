import {
  UpdateDriveLocationDto,
  GetDriverDetailsAndLocationDto,
  WebsocketEvents,
} from '@monorepo/shared';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import {
  getDriverDetailsAndLocationValidatorSchema,
  updateLocationValidatorSchema,
} from './driver.validator';
import { ZodValidationPipe } from 'src/utils/zod.pipe';
import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import { WebsocketExtensionFilter } from 'src/utils/websocket.exception-filter';
import { TokenGuard } from 'src/jwt/jwt.guard';
import { TokenPayload, ValidateToken } from 'src/jwt/jwt.decorator';
import { TokenDto } from 'src/jwt/jwt.type';
import { DriverService } from './driver.service';
import {
  fromEvent,
  map,
  Observable,
  switchMap,
  takeUntil,
  interval,
  tap,
  BehaviorSubject,
} from 'rxjs';
import { Socket, Server } from 'socket.io';
import { Inject } from '@nestjs/common';

import { WebSocketServer } from '@nestjs/websockets';
import { BrokerServices } from 'src/broker/broker.enum';
import { ClientProxy } from '@nestjs/microservices';
import { DriverEvents } from './driver.enum';
import { DriverLocationDetails } from './driver.type';

@WebSocketGateway()
@UseGuards(TokenGuard)
@UseFilters(WebsocketExtensionFilter)
export class DriverWebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly DRIVER_ROOM_PREFIX = 'driver_';
  private pollingSubjects = new Map<string, BehaviorSubject<number>>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly driverService: DriverService,
    @Inject(BrokerServices.DRIVER_SERVICE)
    private readonly driverClient: ClientProxy,
  ) { }

  handleConnection(client: Socket) {
    Logger.debug({ clientId: client.id })
  }

  handleDisconnect(client: Socket) {
    // clean up the polling subjects on disconnect
    [...this.pollingSubjects.keys()]
      .filter((k) => k.startsWith(client.id + '-'))
      .forEach((k) => this.cleanup(k));
  }

  /**
    INFO: 
    This emits the driver location in realtime to all clients listening for it. 
   */
  emitDriverLocationUpdate(payload: DriverLocationDetails) {
    // emit updates to the room
    const room = `${this.DRIVER_ROOM_PREFIX}${payload.driver.id}`;
    this.server
      .to(room)
      .emit(
        WebsocketEvents.DRIVER_DETAILS_AND_LOCATION_RESPONSE,
        payload,
      );
  }

  @ValidateToken()
  @SubscribeMessage(WebsocketEvents.UPDATE_DRIVER_LOCATION)
  async onUpdateDriverLocation(
    @TokenPayload() token: TokenDto,
    @MessageBody(new ZodValidationPipe(updateLocationValidatorSchema))
    payload: UpdateDriveLocationDto,
  ) {
    const location = await this.driverService.addLocation(payload, token.id);
    // INFO: broadcast the location event to all consumers
    this.driverClient.emit(
      DriverEvents.DRIVER_LOCATION_ADDED,
      new DriverLocationDetails(location, location.driver),
    );
    return location;
  }


  joinRoom(id: number, client: Socket) {
    this.leaveRooms(client);
    const room = `${this.DRIVER_ROOM_PREFIX}${id}`;
    void client.join(room);
    Logger.debug(this.joinRoom.name, `joined room ${room}`)
    return room;
  }

  leaveRooms(client: Socket) {
    // leave any active driver rooms 
    const rooms = Array.from(client.rooms);
    for (const room of rooms) {
      if (room.startsWith(this.DRIVER_ROOM_PREFIX)) {
        void client.leave(room);
      }
    }
  }

  @SubscribeMessage(
    WebsocketEvents.SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE,
  )
  subscribeToDriver(
    @ConnectedSocket() client: Socket,
    @MessageBody(
      new ZodValidationPipe(getDriverDetailsAndLocationValidatorSchema),
    )
    payload: GetDriverDetailsAndLocationDto,
  ) {
    this.joinRoom(payload.id, client)
  }

  @SubscribeMessage(
    WebsocketEvents.UNSUBSCRIBE_FROM_DRIVER_LOCATION_UPDATE,
  )
  unsubscribeFromDriverRealtimeUpdates(
    @ConnectedSocket() client: Socket,
  ) {
    this.leaveRooms(client)
  }

  @SubscribeMessage(WebsocketEvents.UNSUBSCRIBE_FROM_DRIVER_LOCATION_UPDATE_EVERY_FIVE_SECONDS)
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody(
      new ZodValidationPipe(getDriverDetailsAndLocationValidatorSchema),
    )
    payload: GetDriverDetailsAndLocationDto,
  ) {
    Logger.debug(this.handleUnsubscribe.name, { unsubscribe: true, payload })
    const key = this.generateSubscriptionKey(client.id, payload.id);
    const subject = this.pollingSubjects.get(key);
    Logger.log({ key })
    if (subject) {
      subject.complete();
      this.pollingSubjects.delete(key);
    }
  }
  /**
    INFO: 
    This fetches the last location of the driver every 5 seconds from the data base and broadcasts that to the connected client. if the location is older than 10 minutes, then a OFFLINE_DRIVER event is fired every 1 minute.
   */
  @SubscribeMessage(
    WebsocketEvents.SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE_EVERY_FIVE_SECONDS,
  )
  getDriverDetailsAndLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody(
      new ZodValidationPipe(getDriverDetailsAndLocationValidatorSchema),
    )
    payload: GetDriverDetailsAndLocationDto,
  ): Observable<WsResponse<any>> {
    const key = this.generateSubscriptionKey(client.id, payload.id);

    // if the client re-subscribes, clean up the old one
    if (this.pollingSubjects.has(key)) {
      this.pollingSubjects.get(key)!.complete();
      this.pollingSubjects.delete(key);
    }

    const pollInterval$ = new BehaviorSubject<number>(0);
    this.pollingSubjects.set(key, pollInterval$);

    Logger.log({ key })

    const disconnect$ = fromEvent(client, 'disconnect').pipe(
      tap(() => this.cleanup(key)),
    );

    return pollInterval$.pipe(
      switchMap((ms) => interval(ms)),
      takeUntil(disconnect$),
      switchMap(() => this.driverService.getDetailsAndLastLocation(payload.id)),
      map((details) => {
        const location = details.locations[0];
        const resp = new DriverLocationDetails(location, details);
        const hasLocation = details.locations.length > 0;
        const isOffline = !hasLocation
          ? true
          : this.driverService.isOlderThanTenMinutes(
            details.locations[0].timestamp.toISOString(),
          );
        return { details: resp, isOffline };
      }),
      tap(({ isOffline }) => {
        pollInterval$.next(isOffline ? 60_000 : 5_000);
      }),
      map(({ details, isOffline }) => ({
        event: isOffline
          ? WebsocketEvents.OFFLINE_DRIVER
          : WebsocketEvents.DRIVER_DETAILS_AND_LOCATION_RESPONSE,
        data: {
          message: isOffline
            ? 'Driver has been offline for a while now'
            : 'Driver is online',
          ...details,
        },
      })),
    );
  }

  private cleanup(key: string) {
    const subj = this.pollingSubjects.get(key);
    if (subj) {
      subj.complete();
      this.pollingSubjects.delete(key);
    }
  }

  private generateSubscriptionKey(socketId: string, driverId: number) {
    return `${socketId}-${driverId}`;
  }
}
