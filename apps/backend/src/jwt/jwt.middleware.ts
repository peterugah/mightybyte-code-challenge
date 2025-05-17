import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from './jwt.service';

@Injectable()
export class JWTMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) { }
  async use(req: Request, res: Response, next: NextFunction) {
    /**
      INFO: 
          If a JWT token is provided when a request is made, this middleware validates the token and parses the data for later use in the controller (check JWTPayload decorator in jwt.decorator.ts file). If the token is invalid / expired, an error is thrown. 
    */
    if (!req.headers.authorization) return next();
    //
    const authorizationHeader = req.headers.authorization;
    const [bearer, token] = authorizationHeader.split(' ');

    if (bearer !== 'Bearer') {
      next(new UnauthorizedException('please provide a valid JWT token'));
    }
    if (!token) {
      next(new UnauthorizedException('please provide a valid JWT token'));
    }
    const tokenData = await this.jwtService.verify(token);
    // set the token data for use in the guards
    res.locals.tokenData = tokenData;
    next();
  }
}
