import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { storageConfig } from './constants/storage.constants';
import { StorageController } from './storage.controller';
import { CloudflareR2Service } from './services/cloudflare-r2.service';

@Module({
  imports: [ConfigModule.forFeature(storageConfig)],
  controllers: [StorageController],
  providers: [
    {
      provide: 'IStorageService',
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('storage.provider');
        const logger = new Logger('StorageModule');

        logger.log(`Initializing storage provider: ${provider}`);

        switch (provider) {
          case 'r2':
          default:
            return new CloudflareR2Service(configService);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: ['IStorageService'],
})
export class StorageModule {}
