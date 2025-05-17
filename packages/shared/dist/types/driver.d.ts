export interface DriverLoginDto {
    username: string;
    password: string;
}
export interface DriverLoginResponse {
    token: string;
    refreshToken: string;
    driver: {
        firstName: string;
        lastName: string;
        image: string;
    };
}
export interface AddDriveLocationDto {
    latitude: number;
    longitude: number;
}
//# sourceMappingURL=driver.d.ts.map