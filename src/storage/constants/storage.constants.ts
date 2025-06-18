import { registerAs } from '@nestjs/config';

export const STORAGE_CONFIG = 'storage';

export const storageConfig = registerAs(STORAGE_CONFIG, () => ({
  provider: process.env.STORAGE_PROVIDER || 'r2',
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL,
  },
}));

export const R2_CONFIG = {
  REGION: 'auto',
  ENDPOINT: (accountId: string): string =>
    `https://${accountId}.r2.cloudflarestorage.com`,
  PUBLIC_URL: (bucketName: string, accountId: string): string =>
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`,
} as const;
