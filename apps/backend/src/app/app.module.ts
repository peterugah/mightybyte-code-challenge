import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DriverModule } from '../driver/driver.module';
import { EnvModule } from '../env/env.module';
import { AppController } from './app.controller';
import { JwtModule } from 'src/jwt/jwt.module';

@Module({
  imports: [PrismaModule, DriverModule, EnvModule, JwtModule],
  controllers: [AppController],
})
export class AppModule { }
