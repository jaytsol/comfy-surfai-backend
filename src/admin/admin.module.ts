import { Module } from '@nestjs/common';
import { AdminWorkflowModule } from './workflow/admin-workflow.module';

@Module({
  imports: [AdminWorkflowModule],
})
export class AdminModule {}
