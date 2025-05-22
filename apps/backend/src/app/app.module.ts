import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DriverModule } from '../driver/driver.module';
import { EnvModule } from '../env/env.module';
import { AppController } from './app.controller';
import { JwtModule } from 'src/jwt/jwt.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BrokerServices } from 'src/broker/broker.enum';

@Module({
  controllers: [AppController],
  imports: [
    PrismaModule,
    DriverModule,
    EnvModule,
    JwtModule,
    ClientsModule.register([
      {
        name: BrokerServices.DRIVER_SERVICE,
        transport: Transport.TCP,
      },
    ]),
  ],
})
export class AppModule { }
