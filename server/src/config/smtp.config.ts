import { registerAs } from '@nestjs/config';

export const smtpConfig = registerAs('smtp', () => ({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  frontendUrl: process.env.FRONTEND_URL,
}));
