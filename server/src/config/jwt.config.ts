import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  jwtAccessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
  jwtRefreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
  jwtAccessTokenExpire: process.env.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshTokenExpire: process.env.JWT_REFRESH_EXPIRES_IN,
}));
