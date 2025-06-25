import { Module } from '@nestjs/common';
import { AdminWorkflowController } from './admin-workflow.controller';
import { AdminWorkflowService } from './admin-workflow.service';
import { WorkflowModule } from 'src/workflow/workflow.module';
import { AuthModule } from 'src/auth/auth.module';

/**
 * 관리자 전용 워크플로우 CRUD 기능을 담당하는 모듈입니다.
 */
@Module({
  imports: [
    // AdminWorkflowService가 기존 WorkflowService의 기능을 사용해야 할 수 있으므로 WorkflowModule을 임포트합니다.
    WorkflowModule,
    // 컨트롤러에서 역할 기반 가드(Guard) 등을 사용하기 위해 AuthModule을 임포트합니다.
    AuthModule,
  ],
  controllers: [AdminWorkflowController],
  providers: [AdminWorkflowService],
  exports: [AdminWorkflowService], // 필요시 다른 관리자 모듈에서 이 서비스를 사용할 수 있도록 export
})
export class AdminWorkflowModule {}
