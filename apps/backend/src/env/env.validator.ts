import { z } from 'zod';
import { EnvEnum } from './env.enum';

const envVariables = Object.values(EnvEnum);
const envObj = {};

for (const env of envVariables) {
  envObj[env] = z.string();
}
const envValidatorSchema = z.object(envObj);

// This is the schema validator to ensure all environment variables are provided before the server successfully starts up
export const envValidator = (config: Record<string, unknown>) => {
  const result = envValidatorSchema.safeParse(config);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.format(), null, 2));
  }
  return result.data;
};
