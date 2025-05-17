import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
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
  parseValue(value: any) {
    try {
      return JSON.parse(value);
    } catch {
      throw new WsException('Invalid json object provided as input');
    }
  }

  transform(value: unknown) {
    const transformedValue =
      typeof value === 'string' ? this.parseValue(value) : value;

    const result = this.schema.safeParse(transformedValue);

    console.log(JSON.stringify(result, null, 2));

    if (!result.success) {
      const formattedError = result.error.format();
      throw new BadRequestException(formattedError);
    }
    return result.data;
  }
}
