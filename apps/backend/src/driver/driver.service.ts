import {
  BadRequestException,
  Injectable,
  Logger,
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
  UpdateDriveLocationDto,
} from '@monorepo/shared';
import { JwtService } from 'src/jwt/jwt.service';
import { DriverDetails } from './driver.type';
import { v4 as uuid } from 'uuid';

@Injectable()
export class DriverService implements OnModuleInit {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) { }

  onModuleInit() {
    void this.generateDemoDrivers()
      .then(() => {
        // print the details of the drivers
        return this.prismaService.driver.findMany({
          select: {
            id: true,
            username: true,
          },
        });
      })
      .then((drivers) => {
        Logger.debug({ drivers });
      });
  }

  allDrivers() {
    return this.prismaService.driver.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        image: true,
        createdAt: true,
        username: true,
      }
    })
  }
  private async generateDemoDrivers() {
    const count = await this.prismaService.driver.count();

    if (count >= 3) {
      return;
    }
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
    await this.prismaService.location.deleteMany();
    await this.prismaService.driver.deleteMany();
    // create demo users
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
      id: driver.id,
      createdAt: driver.createdAt,
      username: driver.username,
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
    const { token, refreshToken } = this.generateTokens(driver.id);
    // update the user's refresh token
    await this.updateRefreshToken(refreshToken, driver.id);

    return { token, refreshToken, driver: this.getDriverDetails(driver) };
  }

  generateTokens(id: number) {
    const token = this.jwtService.generateToken({
      id,
      expiresIn: this.configService.get<number>(EnvEnum.JWT_EXPIRATION)!,
    });

    const refreshToken = this.jwtService.generateRefreshToken({
      id: uuid(),
      expiresIn: this.configService.get<number>(
        EnvEnum.JWT_REFRESH_EXPIRATION,
      )!,
    });
    return { token, refreshToken };
  }

  async getDetailsByRefreshToken(refreshToken: string) {
    return this.prismaService.driver.findFirst({
      where: { refreshToken },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        image: true,
      },
    });
  }

  async getDetailsAndLastLocation(id: number) {
    const record = await this.prismaService.driver.findFirst({
      where: { id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        image: true,

        locations: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
          select: {
            timestamp: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!record) {
      throw new BadRequestException(
        `unabled to load driver details and last location for driver with id: ${id}`,
      );
    }
    return record;
  }

  addLocation(payload: UpdateDriveLocationDto, driverId: number) {
    return this.prismaService.location.create({
      data: {
        ...payload,
        driverId,
      },
      select: {
        id: true,
        driverId: true,
        latitude: true,
        longitude: true,
        timestamp: true,
        driver: {
          select: {
            id: true,
            image: true,
            createdAt: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  isOlderThanTenMinutes(timestamp: string): boolean {
    const tsMillis = new Date(timestamp).getTime();
    const tenMinutesInMs = 10 * 60 * 1000;
    return Date.now() - tsMillis > tenMinutesInMs;
  }
}
