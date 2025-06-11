import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratedOutput } from '../common/entities/generated-output.entity';
import { GeneratedOutputService } from './generated-output.service';
import { AuthModule } from '../auth/auth.module';
import { GeneratedOutputController } from './generated-output.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GeneratedOutput]), AuthModule],
  controllers: [GeneratedOutputController],
  providers: [GeneratedOutputService],
  exports: [GeneratedOutputService],
})
export class GeneratedOutputModule {}
