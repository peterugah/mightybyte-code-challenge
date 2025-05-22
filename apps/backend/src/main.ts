import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EnvEnum } from './env/env.enum';

async function bootstrap() {
  const PORT = process.env.PORT || 3000;
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.enableCors()
  /**
    INFO: 
    This is simulating the connection to a message broker like kafka or rabbitMQ. 
    The broker will be responsible for ensuring that messages get sent and delivered to the client regardless of the server instance they are connected to.
   */
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { port: config.get<number>(EnvEnum.BROKER_PORT) }
  });

  await app.startAllMicroservices();
  await app.listen(PORT);
  Logger.debug(`Http and websocket server listening on port ${PORT}`);
}
void bootstrap();
