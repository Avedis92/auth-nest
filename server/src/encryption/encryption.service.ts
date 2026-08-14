import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  revertToInitialBinaryForm,
  transformABinaryToACertainFormat,
} from 'src/common/helpers/transform';
import { DATA_FORMAT } from 'src/common/types';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class EncryptionService {
  constructor(private configService: ConfigService) {}

  encrypt(text: string) {
    // To encrypt a text, use the following steps:
    // 1- Generate an initialization vector (iv)
    // 2- Generate a cipher instance based on the encryption algorithm, encryption ket and the iv
    // 3- Encrypt the text only
    // 4- Generate the auth tag
    // 5- concat auth tag, iv and the encrypted text together and generate a base64 text
    // 6- return the result

    const iv = crypto.randomBytes(IV_LENGTH);
    const encryptionKey = revertToInitialBinaryForm(
      this.configService.get('encryption.encryptionKey') as string,
      DATA_FORMAT.HEX,
    );
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(text, DATA_FORMAT.UTF8),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Store iv + authTag + cipherText together, base64url-encoded so the
    // result is safe to embed in a URL query param without mangling.
    return transformABinaryToACertainFormat(
      Buffer.concat([iv, authTag, encrypted]),
      DATA_FORMAT.BASE64URL,
    );
  }

  decrypt(payload: string) {
    const data = revertToInitialBinaryForm(payload, DATA_FORMAT.BASE64URL);
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const encryptionKey = revertToInitialBinaryForm(
      this.configService.get('encryption.encryptionKey') as string,
      DATA_FORMAT.HEX,
    );
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return transformABinaryToACertainFormat(decrypted, DATA_FORMAT.UTF8);
  }
}
