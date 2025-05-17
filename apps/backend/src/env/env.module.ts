import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidator } from './env.validator';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validate: envValidator,
    }),
  ],
})
export class EnvModule { }
