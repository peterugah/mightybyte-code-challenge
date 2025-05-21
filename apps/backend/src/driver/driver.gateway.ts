import {
  AddDriveLocationDto,
  GetDriverDetailsAndLocationDto,
  WebsocketMessages,
} from '@monorepo/shared';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { updateLocationValidatorSchema } from './driver.validator';
import { ZodValidationPipe } from 'src/utils/zod.pipe';
import { UseFilters, UseGuards } from '@nestjs/common';
import { WebsocketExtensionFilter } from 'src/utils/websocket.exception-filter';
import { TokenGuard } from 'src/jwt/jwt.guard';
import { TokenPayload, ValidateToken } from 'src/jwt/jwt.decorator';
import { TokenDto } from 'src/jwt/jwt.type';
import { DriverService } from './driver.service';
import {
  from,
  fromEvent,
  interval,
  map,
  Observable,
  of,
  switchMap,
  takeUntil,
  takeWhile,
} from 'rxjs';
import { Socket } from 'socket.io';

@WebSocketGateway()
@UseGuards(TokenGuard)
@UseFilters(WebsocketExtensionFilter)
export class DriverWebsocketGateway {
  constructor(private readonly driverService: DriverService) { }
  /**
   * handler for a driver to send their latest location
   */
  @SubscribeMessage(WebsocketMessages.UPDATE_DRIVER_LOCATION)
  @ValidateToken()
  onUpdateDriverLocation(
    @TokenPayload() token: TokenDto,
    @MessageBody(new ZodValidationPipe(updateLocationValidatorSchema))
    payload: AddDriveLocationDto,
  ) {
    return this.driverService.addLocation(payload, token.id);
  }

  /**
   * handler for the client to get latest details and location of a specific driver
   */
  @SubscribeMessage(WebsocketMessages.REQUEST_DRIVER_DETAILS_AND_LOCATION)
  getDriverDetailsAndLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GetDriverDetailsAndLocationDto,
  ): Observable<WsResponse<any>> {
    const disconnect$ = fromEvent(client, 'disconnect');

    return interval(5_000).pipe(
      takeUntil(disconnect$),
      // fetch the driver's last location
      switchMap(() =>
        from(this.driverService.getDetailsAndLastLocation(payload.id)),
      ),
      // check if the last location is older than 10 minutes
      switchMap((details) => {
        //if there are no location details for the driver, then the driver is offline
        if (details.locations.length === 0) {
          client.emit(WebsocketMessages.OFFLINE_DRIVER, details);
          return of({ isOlderThanTenMinutes: true, details });
        }
        const timestamp = details.locations[0].timestamp.toISOString();
        const isOlderThanTenMinutes =
          this.driverService.isOlderThanTenMinutes(timestamp);
        //emit driver offline if last location is older than ten minutes
        if (isOlderThanTenMinutes) {
          client.emit(WebsocketMessages.OFFLINE_DRIVER, details);
        }
        return of({ isOlderThanTenMinutes, details });
      }),
      // keep sending the response back as long as driver has not been offline for more than 10 minutes
      takeWhile(({ isOlderThanTenMinutes }) => !isOlderThanTenMinutes),
      map(({ details }) => ({
        event: WebsocketMessages.DRIVER_DETAILS_AND_LOCATION_RESPONSE,
        data: details,
      })),
    );
  }
}
