import { registerAs } from '@nestjs/config';

export const encryptionConfig = registerAs('encryption', () => ({
  encryptionKey: process.env.ENCRYPTION_KEY,
}));
