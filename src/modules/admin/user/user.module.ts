import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CoinModule } from 'src/coin/coin.module'; // CoinModule 임포트
import { AuthModule } from 'src/auth/auth.module'; // AuthModule 임포트

@Module({
  imports: [TypeOrmModule.forFeature([User]), CoinModule, AuthModule], // AuthModule 추가
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
