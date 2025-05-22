import { Driver, Location } from '@prisma/client';

export type DriverDetails = Pick<
  Driver,
  'firstName' | 'lastName' | 'image' | 'id' | 'username' | 'createdAt'
>;

export class DriverLocationDetails {
  location: Location;
  driver: DriverDetails;
  constructor(location: Location, driver: DriverDetails) {
    this.location = location;
    this.driver = driver;
  }
}
