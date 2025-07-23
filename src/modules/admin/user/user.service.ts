import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { CoinService } from 'src/coin/coin.service';
import { CoinTransactionReason } from 'src/common/entities/coin-transaction.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly coinService: CoinService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { id: 'DESC' }, // ID 내림차순 정렬
    });
  }

  async addCoin(userId: number, amount: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return this.coinService.addCoins(
      userId,
      amount,
      CoinTransactionReason.ADMIN_ADJUSTMENT,
    );
  }

  async deductCoin(userId: number, amount: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return this.coinService.deductCoins(
      userId,
      amount,
      CoinTransactionReason.ADMIN_ADJUSTMENT,
    );
  }
}
