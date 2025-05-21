import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { VALIDATE_TOKEN_FLAG } from './jwt.constant';
import { JwtService } from './jwt.service';
import { WebSocketRequest } from '@monorepo/shared';
import { Socket } from 'socket.io';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
  ) { }

  async canActivate(context: ExecutionContext) {
    /**
      INFO: 
      This guard only kicks in when the @ValidateToken decorator is applied to an endpoint.
      The decorator sets the VALIDATE_TOKEN_FLAG flag.
      Check jwt.docorator.ts for implementation
    */
    const validateTokenFlag = this.reflector.get<boolean>(
      VALIDATE_TOKEN_FLAG,
      context.getHandler(),
    );

    if (!validateTokenFlag) return true;

    try {
      const contextType = context.getType();
      // validate token for websocket
      if (contextType === 'ws') {
        await this.handleWebsocketRequest(context);
      }

      // validate token for http request
      if (contextType === 'http') {
        await this.handleHttpRequest(context);
      }

      return true;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }
  private handleWebsocketRequest = async (context: ExecutionContext) => {
    const req = context.switchToWs().getData<string>();
    const client = context.switchToWs().getClient<Socket>();

    const body: WebSocketRequest<unknown> = JSON.parse(req);
    if (!body.token) {
      throw new BadRequestException(`Authorization token not provided`);
    }
    if (!body.payload) {
      throw new BadRequestException(
        `Payload not provided for websocket request`,
      );
    }
    const decodedToken = await this.jwtService.verifyToken(body.token);
    client.data.tokenData = decodedToken;
  };

  private handleHttpRequest = async (context: ExecutionContext) => {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      throw new BadRequestException(`Authorization token not provided`);
    }
    const [bearer, token] = authorizationHeader.split(' ');

    if (bearer !== 'Bearer') {
      throw new UnauthorizedException('please provide a valid JWT token');
    }
    if (!token) {
      throw new UnauthorizedException('please provide a valid JWT token');
    }
    const decodedToken = await this.jwtService.verifyToken(token);

    res.locals.tokenData = decodedToken;
  };
}
