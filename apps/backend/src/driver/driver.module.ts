import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from 'src/jwt/jwt.module';
import { DriverController } from './driver.controller';
import { DriverWebsocketGateway } from './driver.gateway';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BrokerServices } from 'src/broker/broker.enum';
import { DriverListener } from './driver.listener';

@Module({
  exports: [DriverService, DriverWebsocketGateway],
  controllers: [DriverController, DriverListener],
  imports: [
    PrismaModule,
    JwtModule,
    ClientsModule.register([
      {
        name: BrokerServices.DRIVER_SERVICE,
        transport: Transport.TCP,
      },
    ]),
  ],
  providers: [DriverService, DriverWebsocketGateway],
})
export class DriverModule { }
