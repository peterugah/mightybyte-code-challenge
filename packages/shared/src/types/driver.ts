export interface DriverLoginDto {
  username: string;
  password: string;
}

export interface DriverLoginResponse {
  token: string;
  refreshToken: string;
  driver: {
    id: number;
    createdAt: Date;
    firstName: string;
    lastName: string;
    image: string;
    username: string;
  }
}

export interface UpdateDriveLocationDto {
  latitude: number;
  longitude: number;
}

export interface GetDriverDetailsAndLocationDto {
  id: number;
}

export interface RefreshDriverTokenDto {
  refreshToken: string;
}