import { Controller } from '@nestjs/common';
import { DriverEvents } from './driver.enum';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DriverLocationDetails } from './driver.type';
import { DriverWebsocketGateway } from './driver.gateway';
@Controller()
export class DriverListener {
  constructor(private readonly driverGateway: DriverWebsocketGateway) { }
  @EventPattern(DriverEvents.DRIVER_LOCATION_ADDED)
  handleLocationAdded(@Payload() data: DriverLocationDetails) {
    this.driverGateway.emitDriverLocationUpdate(data);
  }
}
