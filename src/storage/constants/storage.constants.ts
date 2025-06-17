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

const isProduction = process.env.NODE_ENV === 'production';
const protocol = isProduction ? 'https' : 'http';

export const R2_CONFIG = {
  REGION: 'auto',
  // 운영 환경에서는 https, 개발 환경에서는 http를 사용하도록 수정
  ENDPOINT: (accountId: string): string =>
    `${protocol}://${accountId}.r2.cloudflarestorage.com`,
  PUBLIC_URL: (bucketName: string, accountId: string): string =>
    `${protocol}://${bucketName}.${accountId}.r2.cloudflarestorage.com`,
} as const;
