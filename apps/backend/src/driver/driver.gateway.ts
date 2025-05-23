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
  switchMap,
  takeUntil,
  interval,
  tap,
  BehaviorSubject,
  take,
  Subscription,
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
  /**
  INFO: 
  This in practice will be tracked on redis or a similar in-memory database
   */
  private subscriptions = new Map<string, Subscription>();

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

  handleDisconnect() {
    this.clearAllSubscriptions();
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
    this.leaveDriverUpdateRooms(client)
  }

  @SubscribeMessage(
    WebsocketEvents.UNSUBSCRIBE_TO_DRIVER_LOCATION_UPDATE_EVERY_FIVE_SECONDS,
  )
  unsubscribeFromDriverUpdatesEveryFiveSeconds(
    @ConnectedSocket() client: Socket,
  ) {
    this.leaveDriverUpdateRooms(client)
    this.clearClientSubscriptons(client.id)
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
  ) {

    this.joinRoom(payload.id, client);
    const pollInterval$ = new BehaviorSubject<number>(0);
    const disconnect$ = fromEvent(client, 'disconnect').pipe(take(1));

    const subscription = pollInterval$.pipe(
      switchMap(ms => interval(ms)),
      takeUntil(disconnect$),
      switchMap(() => this.driverService.getDetailsAndLastLocation(payload.id)),
      tap(details => {
        const hasLocation = details.locations.length > 0;
        const location = details.locations[0];
        const isOffline = !hasLocation
          || this.driverService.isOlderThanTenMinutes(location.timestamp.toISOString());
        const response = new DriverLocationDetails(location, details);
        pollInterval$.next(isOffline ? 60_000 : 5_000);
        if (isOffline) {
          this.emitDriverOffline(response);
        } else {
          this.emitDriverLocationUpdate(response);
        }
      })
    ).subscribe();
    // track the subscription for removal on the unsubscribe event
    this.subscriptions.set(`${client.id}-${payload.id}`, subscription)
    // on client disconnection, also end the subscription
    disconnect$.subscribe(() => subscription.unsubscribe());
  }

  private clearAllSubscriptions() {
    for (const key of Array.from(this.subscriptions.keys())) {
      this.subscriptions.get(key)?.unsubscribe();
      this.subscriptions.delete(key);
    }
  }
  private clearClientSubscriptons(clientId: string) {
    for (const key of Array.from(this.subscriptions.keys())) {
      if (key.startsWith(`${clientId}-`)) {
        this.subscriptions.get(key)?.unsubscribe();
        this.subscriptions.delete(key);
      }
    }
  }
  private joinRoom(id: number, client: Socket) {
    this.leaveDriverUpdateRooms(client);
    const room = `${this.DRIVER_ROOM_PREFIX}${id}`;
    void client.join(room);
    Logger.debug(this.joinRoom.name, `joined room ${room}`)
    return room;
  }

  private leaveDriverUpdateRooms(client: Socket) {
    const rooms = Array.from(client.rooms);
    for (const room of rooms) {
      if (room.startsWith(this.DRIVER_ROOM_PREFIX)) {
        void client.leave(room);
      }
    }
    Logger.debug(this.leaveDriverUpdateRooms.name, `left room for client: $${client.id}`)
  }

  emitDriverLocationUpdate(payload: DriverLocationDetails) {
    // emit updates to the room
    const room = `${this.DRIVER_ROOM_PREFIX}${payload.driver.id}`;
    this.server
      .to(room)
      .emit(
        WebsocketEvents.DRIVER_DETAILS_AND_LOCATION_RESPONSE,
        {
          message: "Driver online",
          ...payload,
        },
      );
  }
  emitDriverOffline(payload: DriverLocationDetails) {
    const room = `${this.DRIVER_ROOM_PREFIX}${payload.driver.id}`;
    this.server
      .to(room)
      .emit(
        WebsocketEvents.OFFLINE_DRIVER,
        {
          message: 'Driver has been offline for a while now',
          ...payload,
        },
      );
  }

}
