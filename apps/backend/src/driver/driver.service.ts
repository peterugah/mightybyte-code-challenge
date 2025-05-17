import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

import { Driver, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { EnvEnum } from 'src/env/env.enum';
import {
  DriverLoginDto,
  DriverLoginResponse,
  AddDriveLocationDto,
} from '@monorepo/shared';
import { JwtService } from 'src/jwt/jwt.service';
import { DriverDetails } from './driver.type';

@Injectable()
export class DriverService implements OnModuleInit {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) { }
  onModuleInit() {
    void this.generateDemoDrivers();
  }

  private async generateDemoDrivers() {
    const users: Prisma.DriverCreateManyInput[] = [
      {
        connectionId: '',
        image: 'https://robohash.org/stefan-one',
        username: 'driverone',
        firstName: 'Driver',
        lastName: 'One',
        hashedPassword: this.hashPassword('demo'),
        refreshToken: '',
      },
      {
        connectionId: '',
        image: 'https://robohash.org/stefan-two',
        username: 'drivertwo',
        firstName: 'Driver',
        lastName: 'Two',
        hashedPassword: this.hashPassword('demo'),
        refreshToken: '',
      },
      {
        connectionId: '',
        image: 'https://robohash.org/stefan-three',
        username: 'driverthree',
        firstName: 'Driver',
        lastName: 'Three',
        hashedPassword: this.hashPassword('demo'),
        refreshToken: '',
      },
    ];
    // clear existing data
    await this.prismaService.driver.deleteMany();
    await this.prismaService.driver.createMany({ data: users });
  }

  private hashPassword(password: string) {
    return bcrypt.hashSync(
      password,
      Number(this.configService.get(EnvEnum.PASSWORD_SALT_ROUNDS)),
    );
  }

  private isValidPassword(password: string, hashedPassword: string) {
    return bcrypt.compareSync(password, hashedPassword);
  }

  updateRefreshToken(refreshToken: string, id: number) {
    return this.prismaService.driver.update({
      where: { id },
      data: { refreshToken },
    });
  }

  private getDriverDetails(driver: Driver): DriverDetails {
    return {
      firstName: driver.firstName,
      image: driver.image,
      lastName: driver.lastName,
    };
  }

  async login(data: DriverLoginDto): Promise<DriverLoginResponse> {
    /**
      INFO: 
      if more validation logic was required before logging in the user, I'd move those logic to a validation Pipe instead for better seperation of concern, then this method would strictly handled fetching the user details and confirming that the provided password matches. 
     */

    //  TODO: check how to implement auto blocking of account if incorrect password is tried multiple times
    const driver = await this.prismaService.driver.findFirst({
      where: { username: data.username },
    });
    if (!driver) {
      throw new NotFoundException(
        `Driver with username "${data.username}" not found`,
      );
    }

    const validPassword = this.isValidPassword(
      data.password,
      driver.hashedPassword,
    );

    if (!validPassword) {
      throw new BadRequestException(`incorrect login credentails provided`);
    }

    const token = this.jwtService.generateToken({
      id: driver.id,
      expiresIn: Number(this.configService.get<number>(EnvEnum.JWT_EXPIRATION)),
    });

    const refreshToken = this.jwtService.generateToken({
      id: driver.id,
      expiresIn: Number(
        this.configService.get<number>(EnvEnum.JWT_REFRESH_EXPIRATION)!,
      ),
    });
    // update the user's refresh token
    await this.updateRefreshToken(refreshToken, driver.id);

    return { token, refreshToken, driver: this.getDriverDetails(driver) };
  }

  addLocation(payload: AddDriveLocationDto, driverId: number) {
    return this.prismaService.location.create({
      data: {
        ...payload,
        driverId,
      },
    });
  }
}
