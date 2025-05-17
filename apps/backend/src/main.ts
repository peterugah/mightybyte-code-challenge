import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';
import { TokenGuard } from './jwt/jwt.guard';
import { JwtService } from './jwt/jwt.service';

async function bootstrap() {
  const PORT = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  /** 
    INFO: 
    Appply the token guard to all endpoints. This ensures that when the @ValidateJWT decorator is applied to a controller / endpoint, the guard automatically runs the evaluation logic   
  */
  app.useGlobalGuards(new TokenGuard(reflector, jwtService));

  await app.listen(PORT);
  Logger.debug(`Http and websocket server listening on port ${PORT}`);
}
bootstrap();
