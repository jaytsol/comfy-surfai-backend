import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratedOutput } from '../common/entities/generated-output.entity';
import { GeneratedOutputService } from './generated-output.service';
// import { GeneratedOutputController } from './generated-output.controller.ts'; // 히스토리 API 구현 시 추가

@Module({
  imports: [
    TypeOrmModule.forFeature([GeneratedOutput]), // 이 모듈에서 GeneratedOutput 리포지토리를 사용하도록 설정
  ],
  // controllers: [GeneratedOutputController], // 아직 컨트롤러는 없으므로 주석 처리
  providers: [GeneratedOutputService],
  exports: [GeneratedOutputService], // 다른 모듈(ComfyuiModule)에서 이 서비스를 사용해야 하므로 export
})
export class GeneratedOutputModule {}
