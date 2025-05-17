import { z } from 'zod';

export const driverLoginValidatorSchema = z.object({
  username: z.string({ required_error: 'username is required' }),
  password: z.string({ required_error: 'password is required' }),
});

export const updateLocationValidatorSchema = z.object({
  latitude: z
    .number({
      required_error: 'latitude is required',
      invalid_type_error: 'latitude must be a number',
    })
    .min(-90, { message: 'latitude must be ≥ -90' })
    .max(90, { message: 'latitude must be ≤ 90' }),
  longitude: z
    .number({
      required_error: 'longitude is required',
      invalid_type_error: 'longitude must be a number',
    })
    .min(-180, { message: 'longitude must be ≥ -180' })
    .max(180, { message: 'longitude must be ≤ 180' }),
});
