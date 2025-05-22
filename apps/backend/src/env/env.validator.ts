import { z } from 'zod';
import { EnvEnum } from './env.enum';

const envValidatorSchema = z.object({
  [EnvEnum.PORT]: z.coerce.number(),
  [EnvEnum.JWT_SECRET]: z.string(),
  [EnvEnum.DATABASE_URL]: z.string(),
  [EnvEnum.BROKER_PORT]: z.coerce.number(),
  [EnvEnum.JWT_EXPIRATION]: z.coerce.number(),
  [EnvEnum.PASSWORD_SALT_ROUNDS]: z.coerce.number(),
  [EnvEnum.JWT_REFRESH_EXPIRATION]: z.coerce.number(),
});

// This is the schema validator to ensure all environment variables are provided before the server successfully starts up
export const envValidator = (config: Record<string, unknown>) => {
  const result = envValidatorSchema.safeParse(config);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.format(), null, 2));
  }
  return result.data;
};
