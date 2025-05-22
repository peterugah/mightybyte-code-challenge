import {
  Body,
  Controller,
  Post,
  UseGuards,
  Inject,
  Get,
} from '@nestjs/common';
import { TokenPayload, ValidateToken } from 'src/jwt/jwt.decorator';
import {
  updateLocationValidatorSchema,
} from './driver.validator';
import { UpdateDriveLocationDto, } from '@monorepo/shared';
import { TokenDto } from 'src/jwt/jwt.type';
import { DriverService } from './driver.service';
import { ZodValidationPipe } from 'src/utils/zod.pipe';
import { TokenGuard } from 'src/jwt/jwt.guard';
import { BrokerServices } from 'src/broker/broker.enum';
import { ClientProxy } from '@nestjs/microservices';
import { DriverEvents } from './driver.enum';
import { DriverLocationDetails } from './driver.type';

@Controller('driver')
@UseGuards(TokenGuard)
export class DriverController {
  constructor(
    private readonly driverService: DriverService,
    @Inject(BrokerServices.DRIVER_SERVICE)
    private readonly driverClient: ClientProxy,
  ) { }

  @Get()
  allDrivers() {
    return this.driverService.allDrivers();
  }

  @ValidateToken()
  @Post('update')
  async updateLocation(
    @TokenPayload() token: TokenDto,
    @Body(new ZodValidationPipe(updateLocationValidatorSchema))
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

}
