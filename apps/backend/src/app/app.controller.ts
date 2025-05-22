import { DriverLoginDto, RefreshDriverTokenDto } from '@monorepo/shared';
import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DriverService } from 'src/driver/driver.service';
import { driverLoginValidatorSchema, refreshTokenValidatorSchema } from 'src/driver/driver.validator';
import { TokenGuard } from 'src/jwt/jwt.guard';
import { JwtService } from 'src/jwt/jwt.service';
import { ZodValidationPipe } from 'src/utils/zod.pipe';

@Controller('')
@UseGuards(TokenGuard)
export class AppController {
  constructor(private readonly driverService: DriverService,
    private readonly jwtService: JwtService,
  ) { }

  @Post('login')
  login(
    @Body(new ZodValidationPipe(driverLoginValidatorSchema))
    payload: DriverLoginDto,
  ) {
    return this.driverService.login(payload);
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
