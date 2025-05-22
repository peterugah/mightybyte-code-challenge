import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { EnvEnum } from 'src/env/env.enum';
import { RefreshTokenDto, TokenDto } from './jwt.type';
import { CustomHttpCodes } from '@monorepo/shared';

@Injectable()
export class JwtService implements OnModuleInit {
  private secret = '';
  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    this.secret = this.configService.get<string>(EnvEnum.JWT_SECRET)!;
  }

  generateToken({ id, expiresIn }: TokenDto) {
    return jwt.sign({ id }, this.secret, { expiresIn });
  }

  generateRefreshToken({ id, expiresIn }: RefreshTokenDto) {
    return jwt.sign({ id }, this.secret, { expiresIn });
  }

  private getErrorMessage(
    err: jwt.VerifyErrors,
    type: 'token' | 'refresh token',
  ) {
    switch (err.name) {
      case 'TokenExpiredError':
        return `${type} expired`;
      case 'JsonWebTokenError':
      case 'NotBeforeError':
        return `Invalid ${type} provided`;
      default:
        return `Invalid ${type} provided`;
    }
  }
  verifyToken(token: string) {
    return new Promise<TokenDto>((resolve, reject) => {
      jwt.verify(token, this.secret, (err, decoded: TokenDto) => {
        if (err) {
          reject(
            new BadRequestException(this.getErrorMessage(err, 'token'), {
              cause: CustomHttpCodes.TOKEN_EXPIRED,
            }),
          );
        }
        resolve(decoded);
      });
    });
  }

  verifyRefreshToken(refreshToken: string) {
    return new Promise<RefreshTokenDto>((resolve, reject) => {
      jwt.verify(refreshToken, this.secret, (err, decoded: RefreshTokenDto) => {
        if (err) {
          reject(
            new BadRequestException(
              this.getErrorMessage(err, 'refresh token'),
              {
                cause: CustomHttpCodes.REFRESH_TOKEN_EXPIRED,
              },
            ),
          );
        }
        resolve(decoded);
      });
    });
  }
}
