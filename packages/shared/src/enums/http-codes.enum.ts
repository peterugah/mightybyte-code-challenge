// codes.ts

export const CustomHttpCodes = {
  TOKEN_EXPIRED: 600,
  REFRESH_TOKEN_EXPIRED: 601,
} as const;

// union type: 600 | 601
export type CustomHttpCodesValue = typeof CustomHttpCodes[keyof typeof CustomHttpCodes];


