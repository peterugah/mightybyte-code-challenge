import { WebSocketRequest } from '@monorepo/shared';
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
  This is the zod validation pipe to validate all zod input schemas. 
  When a request is made, a validator schema is defined for the input. This is to ensure that the right data structure is always sent to the backend
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) { }

  /**
    NOTE: 
    Websocket data comes in as string. We expect that all websocket messages would be valid json. 
    This function will try to parse the messages or throw an error. The error will be returned to the websocket as an error message type
 */
  parseWebsocketData(value: string) {
    try {
      const data: WebSocketRequest<unknown> = JSON.parse(value);
      return data.payload;
    } catch {
      throw new BadRequestException('Invalid json object provided as input');
    }
  }

  transform(value: unknown) {
    const transformedValue =
      typeof value === 'string' ? this.parseWebsocketData(value) : value;

    const result = this.schema.safeParse(transformedValue);

    // return the first error
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues[0].message ||
        'error validating request input schema',
      );
    }
    return result.data as unknown;
  }
}
