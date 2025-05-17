import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { JWTDto } from './jwt.type';
import { VALIDATE_JWT_FLAG } from './jwt.constant';
import { JwtService } from './jwt.service';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
  ) { }
  canActivate(context: ExecutionContext) {
    /**
      INFO: 
      This guard only kicks in when the @ValidateJWT decorator is applied to an endpoint. Check jwt.docorator.ts for implementation
  */
    const validateJwt = this.reflector.get<boolean>(
      VALIDATE_JWT_FLAG,
      context.getHandler(),
    );

    /**
      INFO: 
      If it is an open endpint, VALIDATE_JWT_FLAG will not be set (@ValidateJWT will not be applied to the endpoint). In that case, proceed without jwt validation
    */
    if (!validateJwt) return true;

    try {
      const response: Response = context.switchToHttp().getResponse();
      const tokenData = response.locals.tokenData as JWTDto;

      if (!tokenData) {
        throw new UnauthorizedException('please provide a valid JWT token');
      }

      return true;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }
}
