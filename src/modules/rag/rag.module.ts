import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagDocument } from '../../common/entities/rag-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RagDocument])],
  controllers: [],
  providers: [],
})
export class RagModule {}
