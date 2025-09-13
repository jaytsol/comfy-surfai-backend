import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagDocument } from '../../common/entities/rag-document.entity';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { StorageModule } from '../../storage/storage.module';
import { LangchainModule } from '../../langchain/langchain.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RagDocument]),
    StorageModule,
    LangchainModule,
  ],
  controllers: [RagController],
  providers: [RagService],
})
export class RagModule {}
