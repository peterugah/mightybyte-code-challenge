import { Driver } from '@prisma/client';

export type DriverDetails = Pick<Driver, 'firstName' | 'lastName' | 'image'>;
