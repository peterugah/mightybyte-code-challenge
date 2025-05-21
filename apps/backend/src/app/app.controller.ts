import { DriverLoginDto } from '@monorepo/shared';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DriverService } from 'src/driver/driver.service';
import { driverLoginValidatorSchema } from 'src/driver/driver.validator';
import { TokenGuard } from 'src/jwt/jwt.guard';
import { ZodValidationPipe } from 'src/utils/zod.pipe';

@Controller('')
@UseGuards(TokenGuard)
export class AppController {
  constructor(private readonly driverService: DriverService) { }
  @Post('login')
  login(
    @Body(new ZodValidationPipe(driverLoginValidatorSchema))
    payload: DriverLoginDto,
  ) {
    return this.driverService.login(payload);
  }
}
