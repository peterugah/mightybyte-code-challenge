import { WebsocketMessages } from '@monorepo/shared';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { driverLoginValidatorSchema } from './driver.validator';
import { ZodValidationPipe } from 'src/utils/zod.pipe';

@WebSocketGateway()
export class DriverWebsocketGateway {
  @SubscribeMessage(WebsocketMessages.UPDATE_DRIVER_LOCATION)
  onUpdateDriverLocation(
    @MessageBody(new ZodValidationPipe(driverLoginValidatorSchema)) data: any,
  ) {
    console.log({ data });
  }
}
