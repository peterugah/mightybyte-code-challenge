import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LocationModule } from '../location/location.module';
import { DriverModule } from '../driver/driver.module';
import { EnvModule } from '../env/env.module';
import { AppController } from './app.controller';
import { JWTMiddleware } from 'src/jwt/jwt.middleware';
import { JwtModule } from 'src/jwt/jwt.module';

@Module({
  imports: [PrismaModule, LocationModule, DriverModule, EnvModule, JwtModule],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  /** apply the JWT token middleware to all requests that require validation  */
  configure(consumer: MiddlewareConsumer) {
    return consumer
      .apply(JWTMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
