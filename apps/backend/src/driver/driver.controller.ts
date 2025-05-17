import { Body, Controller, Post } from '@nestjs/common';
import { JWTPayload, ValidateJWT } from 'src/jwt/jwt.decorator';
import { ZodValidationPipe } from 'utils/zod.pipe';
import { updateLocationValidatorSchema } from './driver.validator';
import { AddDriveLocationDto } from '@monorepo/shared';
import { JWTDto } from 'src/jwt/jwt.type';
import { DriverService } from './driver.service';

@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) { }
  @ValidateJWT()
  @Post('update')
  updateLocation(
    @JWTPayload() token: JWTDto,
    @Body(new ZodValidationPipe(updateLocationValidatorSchema))
    payload: AddDriveLocationDto,
  ) {
    return this.driverService.addLocation(payload, token.id);
  }
}
