import {
  UpdateDriveLocationDto,
  GetDriverDetailsAndLocationDto,
  WebsocketEvents,
} from '@monorepo/shared';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
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
  from,
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
export class DriverWebsocketGateway implements OnGatewayConnection {
  private readonly DRIVER_ROOM_PREFIX = 'driver_';

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

  emitDriverLocationUpdate(payload: DriverLocationDetails) {
    // emit updates to the room
    const room = `${this.DRIVER_ROOM_PREFIX}${payload.driver.id}`;
    this.server
      .to(room)
      .emit(
        WebsocketEvents.DRIVER_DETAILS_AND_LOCATION_RESPONSE_REALTIME,
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
    Logger.debug({ payload })
    const location = await this.driverService.addLocation(payload, token.id);
    // INFO: broadcast the location event to all consumers
    this.driverClient.emit(
      DriverEvents.DRIVER_LOCATION_ADDED,
      new DriverLocationDetails(location, location.driver),
    );
    return location;
  }

  @SubscribeMessage(
    WebsocketEvents.SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE_IN_REALTIME,
  )
  subscribeToDriver(
    @ConnectedSocket() client: Socket,
    @MessageBody(
      new ZodValidationPipe(getDriverDetailsAndLocationValidatorSchema),
    )
    payload: GetDriverDetailsAndLocationDto,
  ) {
    const rooms = Array.from(client.rooms);
    // if the user is already listening for a different driver, remove them from the room
    for (const room of rooms) {
      if (room.startsWith(this.DRIVER_ROOM_PREFIX)) {
        void client.leave(room);
      }
    }
    // add the client to the room listening for updates from the selected driver
    void client.join(`${this.DRIVER_ROOM_PREFIX}${payload.id}`);
    return { subscribed: payload.id };
  }

  @SubscribeMessage(
    WebsocketEvents.REQUEST_DRIVER_DETAILS_AND_LOCATION_EVERY_FIVE_SECONDS,
  )
  getDriverDetailsAndLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GetDriverDetailsAndLocationDto,
  ): Observable<WsResponse<any>> {
    const disconnect$ = fromEvent(client, 'disconnect');
    const pollInterval$ = new BehaviorSubject<number>(0);

    return pollInterval$.pipe(
      switchMap((intervalMs) => interval(intervalMs)),
      takeUntil(disconnect$),
      switchMap(() =>
        from(this.driverService.getDetailsAndLastLocation(payload.id)),
      ),
      map((details) => {
        const hasLocation = details.locations.length > 0;
        if (!hasLocation) {
          return { details, isOffline: true };
        }
        const timestamp = details.locations[0].timestamp.toISOString();
        const isOffline = this.driverService.isOlderThanTenMinutes(timestamp);
        return { details, isOffline };
      }),
      tap(({ isOffline }) => {
        pollInterval$.next(isOffline ? 60_000 : 5_000);
      }),
      map(({ details, isOffline }) => ({
        event: isOffline
          ? WebsocketEvents.OFFLINE_DRIVER
          : WebsocketEvents.DRIVER_DETAILS_AND_LOCATION_RESPONSE_EVERY_FIVE_SECONDS,
        data: {
          message: isOffline
            ? 'Driver has been offline for a while now'
            : 'Driver is online',
          ...details,
        },
      })),
    );
  }
}
