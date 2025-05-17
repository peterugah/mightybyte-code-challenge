import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Response } from 'express';
import { JWTDto } from './jwt.type';
import { VALIDATE_JWT_FLAG } from './jwt.constant';

/** 
  INFO: 
  This decorator is a helper method to extract the payload of the JWT.
 */
export const JWTPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const response: Response = ctx.switchToHttp().getResponse();
    return response.locals.tokenData as JWTDto;
  },
);
/**
  INFO: 
  This decorator when applied to a controller or endpoint, ensures a valid JWT is used to access the endpoint
 */
export const ValidateJWT = () => SetMetadata(VALIDATE_JWT_FLAG, true);
