import {
  Controller,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { AdminCoinService } from './admin-coin.service';
import { UpdateUserCoinDto } from 'src/common/dto/coin/update-user-coin.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { User } from 'src/common/entities/user.entity';

import { AuthGuard } from '@nestjs/passport'; // AuthGuard 임포트

@UseGuards(AuthGuard('jwt'), RolesGuard) // AuthGuard를 먼저 적용
@Roles(Role.Admin)
@Controller('admin/coin')
export class AdminCoinController {
  constructor(private readonly adminCoinService: AdminCoinService) {}

  @Post('add/:userId')
  @ApiBody({
    type: UpdateUserCoinDto,
    examples: {
      addCoinsExample: {
        summary: '코인 추가 예시',
        value: {
          amount: 100,
          reason: 'admin_adjustment',
        },
      },
    },
  })
  async addCoins(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserCoinDto: UpdateUserCoinDto,
  ): Promise<User> {
    return this.adminCoinService.addCoinsToUser(
      userId,
      updateUserCoinDto.amount,
      updateUserCoinDto.reason,
    );
  }

  @Post('deduct/:userId')
  @ApiBody({
    type: UpdateUserCoinDto,
    examples: {
      deductCoinsExample: {
        summary: '코인 차감 예시',
        value: {
          amount: 50,
          reason: 'admin_adjustment',
        },
      },
    },
  })
  async deductCoins(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserCoinDto: UpdateUserCoinDto,
  ): Promise<User> {
    return this.adminCoinService.deductCoinsFromUser(
      userId,
      updateUserCoinDto.amount,
      updateUserCoinDto.reason,
    );
  }
}
