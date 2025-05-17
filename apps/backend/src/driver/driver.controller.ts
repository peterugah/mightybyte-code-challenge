import { Body, Controller, Post, UseFilters } from '@nestjs/common';
import { JWTPayload, ValidateJWT } from 'src/jwt/jwt.decorator';
import { updateLocationValidatorSchema } from './driver.validator';
import { AddDriveLocationDto } from '@monorepo/shared';
import { JWTDto } from 'src/jwt/jwt.type';
import { DriverService } from './driver.service';
import { ZodValidationPipe } from 'src/utils/zod.pipe';

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
