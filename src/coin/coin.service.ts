import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { User } from '../common/entities/user.entity';
import {
  CoinTransaction,
  CoinTransactionType,
  CoinTransactionReason,
} from '../common/entities/coin-transaction.entity';

@Injectable()
export class CoinService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CoinTransaction)
    private readonly coinTransactionRepository: Repository<CoinTransaction>,
    private readonly dataSource: DataSource, // 트랜잭션 관리를 위해 DataSource 주입
  ) {}

  /**
   * 사용자에게 코인을 추가하고 트랜잭션을 기록합니다.
   * @param userId 코인을 추가할 사용자 ID
   * @param amount 추가할 코인 양 (양수)
   * @param reason 코인 추가 이유
   * @param relatedEntityId 관련 엔티티 ID (선택 사항)
   * @returns 업데이트된 사용자 엔티티
   */
  async addCoins(
    userId: number,
    amount: number,
    reason: CoinTransactionReason,
    relatedEntityId?: string,
    queryRunner?: QueryRunner, // QueryRunner를 선택적 인자로 추가
  ): Promise<User> {
    if (amount <= 0) {
      throw new BadRequestException('추가할 코인 양은 0보다 커야 합니다.');
    }

    const qr = queryRunner || this.dataSource.createQueryRunner();
    if (!queryRunner) {
      await qr.connect();
      await qr.startTransaction();
    }

    try {
      const user = await qr.manager.findOne(User, {
        where: { id: userId },
      });
      if (!user) {
        throw new BadRequestException('사용자를 찾을 수 없습니다.');
      }

      user.coinBalance += amount;
      await qr.manager.save(user);

      const transaction = qr.manager.create(CoinTransaction, {
        userId: user.id,
        type: CoinTransactionType.GAIN,
        amount: amount,
        reason: reason,
        relatedEntityId: relatedEntityId,
        currentBalance: user.coinBalance,
      });
      await qr.manager.save(transaction);

      if (!queryRunner) {
        await qr.commitTransaction();
      }
      return user;
    } catch (error) {
      if (!queryRunner) {
        await qr.rollbackTransaction();
      }
      throw new InternalServerErrorException(
        `코인 추가 실패: ${error.message}`,
      );
    } finally {
      if (!queryRunner) {
        await qr.release();
      }
    }
  }

  /**
   * 사용자로부터 코인을 차감하고 트랜잭션을 기록합니다.
   * @param userId 코인을 차감할 사용자 ID
   * @param amount 차감할 코인 양 (양수)
   * @param reason 코인 차감 이유
   * @param relatedEntityId 관련 엔티티 ID (선택 사항)
   * @param queryRunner 외부 트랜잭션에 참여하기 위한 QueryRunner (선택 사항)
   * @returns 업데이트된 사용자 엔티티
   */
  async deductCoins(
    userId: number,
    amount: number,
    reason: CoinTransactionReason,
    relatedEntityId?: string,
    queryRunner?: QueryRunner, // QueryRunner를 선택적 인자로 추가
  ): Promise<User> {
    if (amount <= 0) {
      throw new BadRequestException('차감할 코인 양은 0보다 커야 합니다.');
    }

    const qr = queryRunner || this.dataSource.createQueryRunner();
    if (!queryRunner) {
      await qr.connect();
      await qr.startTransaction();
    }

    try {
      const user = await qr.manager.findOne(User, {
        where: { id: userId },
      });
      if (!user) {
        throw new BadRequestException('사용자를 찾을 수 없습니다.');
      }

      if (user.coinBalance < amount) {
        throw new BadRequestException('코인 잔액이 부족합니다.');
      }

      user.coinBalance -= amount;
      await qr.manager.save(user);

      const transaction = qr.manager.create(CoinTransaction, {
        userId: user.id,
        type: CoinTransactionType.DEDUCT,
        amount: amount,
        reason: reason,
        relatedEntityId: relatedEntityId,
        currentBalance: user.coinBalance,
      });
      await qr.manager.save(transaction);

      if (!queryRunner) {
        await qr.commitTransaction();
      }
      return user;
    } catch (error) {
      if (!queryRunner) {
        await qr.rollbackTransaction();
      }
      // 코인 잔액 부족은 BadRequestException으로 처리
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `코인 차감 실패: ${error.message}`,
      );
    } finally {
      if (!queryRunner) {
        await qr.release();
      }
    }
  }

  /**
   * 사용자의 현재 코인 잔액을 조회합니다.
   * @param userId 사용자 ID
   * @returns 코인 잔액
   */
  async getBalance(userId: number): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }
    return user.coinBalance;
  }

  /**
   * 사용자의 코인 거래 내역을 조회합니다.
   * @param userId 사용자 ID
   * @returns 코인 거래 내역 목록
   */
  async getTransactions(userId: number): Promise<CoinTransaction[]> {
    return this.coinTransactionRepository.find({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
    });
  }
}
