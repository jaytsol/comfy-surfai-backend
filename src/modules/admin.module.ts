import { Module } from '@nestjs/common';
import { WorkflowModule } from './workflow/workflow.module';
import { AdminCoinModule } from './coin/admin-coin.module';

@Module({
  imports: [WorkflowModule, AdminCoinModule],
})
export class AdminModule {}
