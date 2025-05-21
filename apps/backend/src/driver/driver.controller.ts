import {
  Body,
  Controller,
  Post,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { TokenPayload, ValidateToken } from 'src/jwt/jwt.decorator';
import {
  refreshTokenValidatorSchema,
  updateLocationValidatorSchema,
} from './driver.validator';
import { AddDriveLocationDto, RefreshDriverTokenDto } from '@monorepo/shared';
import { TokenDto } from 'src/jwt/jwt.type';
import { DriverService } from './driver.service';
import { ZodValidationPipe } from 'src/utils/zod.pipe';
import { TokenGuard } from 'src/jwt/jwt.guard';
import { JwtService } from 'src/jwt/jwt.service';
import { ConfigService } from '@nestjs/config';
import { EnvEnum } from 'src/env/env.enum';

@Controller('driver')
@UseGuards(TokenGuard)
export class DriverController {
  constructor(
    private readonly driverService: DriverService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }
  @ValidateToken()
  @Post('update')
  updateLocation(
    @TokenPayload() token: TokenDto,
    @Body(new ZodValidationPipe(updateLocationValidatorSchema))
    payload: AddDriveLocationDto,
  ) {
    return this.driverService.addLocation(payload, token.id);
  }
  /**
  INFO: 
  When the driver's token expires, he gets a token expired error with a 600 statusCode for both an HTTP and WS connection.This endpoint is used to refresh the token which can then be used to make the request again and subsequent requests.
 */
  @Post('refresh-token')
  async refreshToken(
    @Body(new ZodValidationPipe(refreshTokenValidatorSchema))
    payload: RefreshDriverTokenDto,
  ) {
    await this.jwtService.verifyRefreshToken(payload.refreshToken);
    const driver = await this.driverService.getDetailsByRefreshToken(
      payload.refreshToken,
    );
    if (!driver) {
      throw new BadRequestException(`unabled to refresh drivers's token`);
    }

    const { token, refreshToken } = this.driverService.generateTokens(
      driver.id,
    );
    await this.driverService.updateRefreshToken(refreshToken, driver.id);
    return { token, refreshToken, driver };
  }
}
