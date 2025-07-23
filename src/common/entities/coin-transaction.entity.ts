import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum CoinTransactionType {
  GAIN = 'gain',
  DEDUCT = 'deduct',
}

export enum CoinTransactionReason {
  PURCHASE = 'purchase', // 결제 시스템 연동 시 사용
  PROMOTION = 'promotion',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  IMAGE_GENERATION = 'image_generation',
  VIDEO_GENERATION = 'video_generation',
  // 기타 코인 소모/획득 이유 추가
}

@Entity('coin_transactions')
export class CoinTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number; // User 엔티티와의 관계를 위한 ID

  @ManyToOne(() => User, (user) => user.coinTransactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: CoinTransactionType })
  type: CoinTransactionType;

  @Column({ type: 'int' })
  amount: number; // 변동된 코인 양 (양수)

  @Column({ type: 'enum', enum: CoinTransactionReason })
  reason: CoinTransactionReason;

  @Column({ nullable: true })
  relatedEntityId?: string; // 관련 엔티티 ID (예: generated_output.id)

  @Column({ type: 'int' })
  currentBalance: number; // 이 트랜잭션 후의 사용자 코인 잔액

  @CreateDateColumn()
  createdAt: Date;
}
