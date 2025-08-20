import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('ENCRYPTION_KEY');
    if (!secret || secret.length !== 64) {
      throw new Error(
        'ENCRYPTION_KEY must be a 64-character hex string (32 bytes).',
      );
    }
    this.key = Buffer.from(secret, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Store iv, authTag, and encrypted data together, separated by a colon
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString(
      'hex',
    )}`;
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    try {
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = Buffer.from(parts[2], 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // This now only catches crypto errors, not my format validation error.
      throw new Error(
        'Decryption failed. Data may be corrupted or tampered with.',
      );
    }
  }
}
