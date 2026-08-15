// src/config/configuration.validation.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Database
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),

  // Jwt
  JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
  JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().required(),
  JWT_TEMP_ACCESS_EXPIRES_IN: Joi.string().required(),

  // SMTP
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  FRONTEND_URL: Joi.string().required(),

  // Google OAuth Credentials
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_REDIRECT_URI: Joi.string().required(),
  GOOGLE_AUTHORIZATION_ENDPOINT: Joi.string().required(),
  GOOGLE_TOKEN_ENDPOINT: Joi.string().required(),
  GOOGLE_USER_INFO_ENDPOINT: Joi.string().required(),

  // Encryption key
  ENCRYPTION_KEY: Joi.string().required(),
});
