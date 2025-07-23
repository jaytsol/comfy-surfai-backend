import { Module } from '@nestjs/common';
import { WorkflowModule } from './workflow/workflow.module';
import { AdminCoinModule } from './coin/admin-coin.module';
import { UserModule } from './admin/user/user.module'; // UserModule 임포트

@Module({
  imports: [WorkflowModule, AdminCoinModule, UserModule],
})
export class AdminModule {}
