export interface DriverLoginDto {
  username: string;
  password: string;
}

export interface Driver {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string;
  createdAt: Date;
}

export interface DriverLoginResponse {
  token: string;
  refreshToken: string;
  driver: Driver;
}

export interface Location {
  id: number;
  latitude: number;
  longitude: number;
  driverId: number;
  timestamp: Date;
}

export type UpdateDriveLocationDto = Pick<Location, "longitude" | "latitude">

export interface GetDriverDetailsAndLocationDto {
  id: number;
}

export interface RefreshDriverTokenDto {
  refreshToken: string;
}


export interface DriverLocationDetailsResponse {
  message: string;
  location: Location;
  driver: Driver;
}
