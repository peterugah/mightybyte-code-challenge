import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
  This is the zod validation pipe to validate all zod input schemas. 
  When a request is made, a validator schema is defined for the input. This is to ensure that the right data structure is always sent to the backend
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) { }

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const formattedError = result.error.format();
      throw new BadRequestException(formattedError);
    }
    return result.data;
  }
}
