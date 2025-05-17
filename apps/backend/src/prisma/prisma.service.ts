import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
/**
INFO:
Ideally, I’d set up a database interface that the database clients will implement, then have a generic database class that injects the preferred client. But, for the sake of this code challenge, I'll go with prisma directly
 */
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
