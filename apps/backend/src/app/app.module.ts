import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DriverModule } from '../driver/driver.module';
import { EnvModule } from '../env/env.module';
import { AppController } from './app.controller';
import { JwtModule } from 'src/jwt/jwt.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BrokerServices } from 'src/broker/broker.enum';
import { ConfigService } from '@nestjs/config';
import { EnvEnum } from 'src/env/env.enum';

@Module({
  controllers: [AppController],
  imports: [
    PrismaModule,
    DriverModule,
    EnvModule,
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
})
export class AppModule { }
