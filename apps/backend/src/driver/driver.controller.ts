import {
  Body,
  Controller,
  Post,
  UseGuards,
  BadRequestException,
  Inject,
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
import { BrokerServices } from 'src/broker/broker.enum';
import { ClientProxy } from '@nestjs/microservices';
import { DriverEvents } from './driver.enum';
import { DriverLocationDetails } from './driver.type';

@Controller('driver')
@UseGuards(TokenGuard)
export class DriverController {
  constructor(
    private readonly driverService: DriverService,
    private readonly jwtService: JwtService,
    @Inject(BrokerServices.DRIVER_SERVICE)
    private readonly driverClient: ClientProxy,
  ) { }

  @ValidateToken()
  @Post('update')
  async updateLocation(
    @TokenPayload() token: TokenDto,
    @Body(new ZodValidationPipe(updateLocationValidatorSchema))
    payload: AddDriveLocationDto,
  ) {
    const location = await this.driverService.addLocation(payload, token.id);
    // INFO: broadcast the location event to all consumers
    this.driverClient.emit(
      DriverEvents.DRIVER_LOCATION_ADDED,
      new DriverLocationDetails(location, location.driver),
    );
    return location;
  }

  /**
  INFO: 
    When the driver's token expires, he gets a token expired error with a 600 statusCode for both an HTTP and WS connection. This endpoint is used to refresh the token which can then be used to make the request again and subsequent requests.
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
      throw new BadRequestException(`Unabled to refresh drivers's token`);
    }

    const { token, refreshToken } = this.driverService.generateTokens(
      driver.id,
    );
    await this.driverService.updateRefreshToken(refreshToken, driver.id);
    return { token, refreshToken, driver };
  }
}
