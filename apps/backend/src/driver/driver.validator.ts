import { z } from 'zod';

export const driverLoginValidatorSchema = z.object({
  username: z.string({ required_error: 'username field is required' }),
  password: z.string({ required_error: 'password field is required' }),
});

export const updateLocationValidatorSchema = z.object({
  latitude: z
    .number({
      required_error: 'latitude field is required',
      invalid_type_error: 'latitude must be a number',
    })
    .min(-90, { message: 'latitude must be ≥ -90' })
    .max(90, { message: 'latitude must be ≤ 90' }),
  longitude: z
    .number({
      required_error: 'longitude field is required',
      invalid_type_error: 'longitude must be a number',
    })
    .min(-180, { message: 'longitude must be ≥ -180' })
    .max(180, { message: 'longitude must be ≤ 180' }),
});

export const getDriverDetailsAndLocationValidatorSchema = z.object({
  id: z.number({ required_error: 'driver id is required' }),
});

export const refreshTokenValidatorSchema = z.object({
  refreshToken: z.string({ required_error: 'refresh token is required' }),
});
