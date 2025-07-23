import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { GeneratedOutput } from './generated-output.entity';
import { Workflow } from './workflow.entity';
import { CoinTransaction } from './coin-transaction.entity';
import { Role } from '../enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  displayName: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ unique: true, nullable: true })
  googleId?: string;

  @Column({ nullable: true, length: 2048 })
  imageUrl?: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
  })
  role: Role;

  @Column({ nullable: true, select: false, type: 'varchar' })
  currentHashedRefreshToken?: string | null;

  // 코인 잔액 추가
  @Column({ type: 'int', default: 0 })
  coinBalance: number;

  @OneToMany(
    () => GeneratedOutput,
    (generatedOutput) => generatedOutput.ownerUser,
  )
  generatedOutputs: GeneratedOutput[];

  @OneToMany(() => Workflow, (workflow) => workflow.ownerUser)
  workflows: Workflow[];

  @OneToMany(() => CoinTransaction, (transaction) => transaction.user)
  coinTransactions: CoinTransaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
