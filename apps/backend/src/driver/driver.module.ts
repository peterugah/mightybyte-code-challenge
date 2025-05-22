import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from 'src/jwt/jwt.module';
import { DriverController } from './driver.controller';
import { DriverWebsocketGateway } from './driver.gateway';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BrokerServices } from 'src/broker/broker.enum';
import { DriverListener } from './driver.listener';
import { ConfigService } from '@nestjs/config';
import { EnvEnum } from 'src/env/env.enum';

@Module({
  exports: [DriverService, DriverWebsocketGateway],
  controllers: [DriverController, DriverListener],
  imports: [
    PrismaModule,
    JwtModule,
    ClientsModule.registerAsync({
      clients: [
        {
          name: BrokerServices.DRIVER_SERVICE,
          inject: [ConfigService],
          useFactory(config: ConfigService) {
            return {
              transport: Transport.TCP,
              options: {
                port: config.get<number>(EnvEnum.BROKER_PORT),
              }

            }
          }

        },
      ]
    }),
  ],
  providers: [DriverService, DriverWebsocketGateway],
})
export class DriverModule { }
