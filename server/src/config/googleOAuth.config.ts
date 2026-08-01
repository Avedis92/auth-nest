import { registerAs } from '@nestjs/config';

export const googleOAuthConfig = registerAs('google', () => ({
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
  googleAuthorizationEndpoint: process.env.GOOGLE_AUTHORIZATION_ENDPOINT,
  googleTokenEndpoint: process.env.GOOGLE_TOKEN_ENDPOINT,
  googleUserInfoEndpoint: process.env.GOOGLE_USER_INFO_ENDPOINT,
}));
