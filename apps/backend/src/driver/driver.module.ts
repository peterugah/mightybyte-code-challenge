import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from 'src/jwt/jwt.module';
import { DriverController } from './driver.controller';

@Module({
  providers: [DriverService],
  exports: [DriverService],
  imports: [PrismaModule, JwtModule],
  controllers: [DriverController],
})
export class DriverModule { }
