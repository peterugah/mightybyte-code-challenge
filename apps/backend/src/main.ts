import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const PORT = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
  Logger.debug(`Http and websocket server listening on port ${PORT}`);
}
void bootstrap();
