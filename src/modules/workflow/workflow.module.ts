import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from 'src/common/entities/workflow.entity';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PublicWorkflowController } from './public-workflow.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow]), AuthModule],
  controllers: [WorkflowController, PublicWorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
