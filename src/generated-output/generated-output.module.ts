import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratedOutput } from '../common/entities/generated-output.entity';
import { GeneratedOutputService } from './generated-output.service';
import { AuthModule } from '../auth/auth.module';
import { GeneratedOutputController } from './generated-output.controller';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeneratedOutput]),
    AuthModule,
    StorageModule,
  ],
  controllers: [GeneratedOutputController],
  providers: [GeneratedOutputService],
  exports: [GeneratedOutputService],
})
export class GeneratedOutputModule {}
