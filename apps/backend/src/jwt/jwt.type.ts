export interface TokenDto {
  id: number;
  expiresIn: number;
}

export interface RefreshTokenDto {
  id: string;
  expiresIn: number;
}
