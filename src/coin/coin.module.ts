import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinService } from './coin.service';
import { User } from '../common/entities/user.entity';
import { CoinTransaction } from '../common/entities/coin-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, CoinTransaction])],
  providers: [CoinService],
  exports: [CoinService], // 다른 모듈에서 CoinService를 사용할 수 있도록 export
})
export class CoinModule {}
