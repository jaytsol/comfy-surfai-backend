import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { CoinTransaction } from 'src/common/entities/coin-transaction.entity';
import { CoinService } from 'src/coin/coin.service';
import { AdminCoinService } from './admin-coin.service';
import { AdminCoinController } from './admin-coin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, CoinTransaction])],
  providers: [CoinService, AdminCoinService],
  controllers: [AdminCoinController],
  exports: [AdminCoinService],
})
export class AdminCoinModule {}
