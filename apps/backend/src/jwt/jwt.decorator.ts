import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Response } from 'express';
import { TokenDto } from './jwt.type';
import { VALIDATE_TOKEN_FLAG } from './jwt.constant';
import { Socket } from 'socket.io';

/** 
  INFO: 
  This decorator is a helper method to extract the payload of the JWT.
 */
export const TokenPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const contextType = ctx.getType();

    if (contextType === 'ws') {
      const client = ctx.switchToWs().getClient<Socket>();
      return client.data.tokenData as TokenDto;
    }

    if (contextType === 'http') {
      const response: Response = ctx.switchToHttp().getResponse();
      return response.locals.tokenData as TokenDto;
    }

    throw new BadRequestException(`http or ws context type not detected`);
  },
);
/**
  INFO: 
  This decorator when applied to a controller or endpoint, ensures a valid JWT is used to access the endpoint
 */
export const ValidateToken = () => SetMetadata(VALIDATE_TOKEN_FLAG, true);
