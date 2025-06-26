// src/workflow/workflow.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // 👈 TypeOrmModule 임포트
import { Workflow } from '../../common/entities/workflow.entity'; // 👈 Workflow 엔티티 임포트 (경로 확인!)
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { AuthModule } from '../../auth/auth.module'; // AuthModule이 필요하다면 임포트 유지

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow]), // ✨ 이 부분을 추가해야 합니다!
    AuthModule, // AuthModule에서 Guards 등을 export하여 사용한다면 필요합니다.
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService], // 다른 모듈에서 WorkflowService를 사용한다면 export
})
export class WorkflowModule {}
