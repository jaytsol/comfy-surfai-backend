import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { CoinService } from 'src/coin/coin.service';
import { CoinTransactionReason } from 'src/common/entities/coin-transaction.entity';

@Injectable()
export class AdminCoinService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly coinService: CoinService,
  ) {}

  async addCoinsToUser(
    userId: number,
    amount: number,
    reason: string,
  ): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.coinService.addCoins(
      userId,
      amount,
      reason as CoinTransactionReason, // 관리자 추가는 커스텀 이유를 허용
    );

    // 코인 잔액 업데이트 후 사용자 정보 다시 로드
    const updatedUser = await this.userRepository.findOneBy({ id: userId });
    return updatedUser as User;
  }

  async deductCoinsFromUser(
    userId: number,
    amount: number,
    reason: string,
  ): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.coinService.deductCoins(
      userId,
      amount,
      reason as CoinTransactionReason, // 관리자 차감은 커스텀 이유를 허용
    );

    // 코인 잔액 업데이트 후 사용자 정보 다시 로드
    const updatedUser = await this.userRepository.findOneBy({ id: userId });
    return updatedUser as User;
  }
}
