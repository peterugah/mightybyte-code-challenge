import { HttpException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { EnvEnum } from 'src/env/env.enum';
import { JWTDto } from './jwt.type';
import { CustomHttpCodes } from '@monorepo/shared';

@Injectable()
export class JwtService implements OnModuleInit {
  private secret = '';
  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    this.secret = this.configService.get<string>(EnvEnum.JWT_SECRET)!;
  }

  generateToken({ id, expiresIn }: JWTDto) {
    return jwt.sign({ id }, this.secret, { expiresIn }); //expires in 5 minutes
  }

  verify(token: string) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, (err, decoded: JWTDto) => {
        if (err) {
          reject(
            new HttpException(
              'jwt token expired, refresh token',
              /**
                  INFO: 
                  When this custom status code is returned on any request to the frontend, The frontend is required to make a follow up request to refresh the token 
                */
              CustomHttpCodes.JWT_EXPIRED,
            ),
          );
        }
        resolve(decoded);
      });
    });
  }
}
