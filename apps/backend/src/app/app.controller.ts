import { DriverLoginDto } from '@monorepo/shared';
import { Body, Controller, Post } from '@nestjs/common';
import { DriverService } from 'src/driver/driver.service';
import { driverLoginValidatorSchema } from 'src/driver/driver.validator';
import { ZodValidationPipe } from 'utils/zod.pipe';

@Controller('')
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
