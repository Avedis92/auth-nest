import { SetMetadata } from '@nestjs/common';

export const ALLOW_TEMPORARY_TOKEN_KEY = 'allowTemporaryToken';
export const AllowTemporaryToken = () =>
  SetMetadata(ALLOW_TEMPORARY_TOKEN_KEY, true);
