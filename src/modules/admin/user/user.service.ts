import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { CoinService } from 'src/coin/coin.service';
import { CoinTransactionReason } from 'src/common/entities/coin-transaction.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto'; // PaginationDto 임포트
import { PaginatedResponse } from 'src/common/interfaces/pagination.interface'; // PaginatedResponse 임포트

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly coinService: CoinService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10 } = paginationDto;
    const [data, total] = await this.userRepository.findAndCount({
      order: { id: 'DESC' }, // ID 내림차순 정렬
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
