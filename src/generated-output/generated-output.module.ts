import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratedOutput } from '../common/entities/generated-output.entity';
import { GeneratedOutputService } from './generated-output.service';
// import { GeneratedOutputController } from './generated-output.controller'; // 향후 히스토리 API 컨트롤러 추가 시

@Module({
  imports: [
    TypeOrmModule.forFeature([GeneratedOutput]), // 이 모듈에서 GeneratedOutput 리포지토리를 사용하도록 설정
  ],
  // controllers: [GeneratedOutputController],
  providers: [GeneratedOutputService],
  exports: [GeneratedOutputService], // ComfyuiModule에서 이 서비스를 주입받아 사용해야 하므로 export
})
export class GeneratedOutputModule {}
