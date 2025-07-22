import {
  Controller,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminCoinService } from './admin-coin.service';
import { UpdateUserCoinDto } from 'src/common/dto/coin/update-user-coin.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { User } from 'src/common/entities/user.entity';

@UseGuards(RolesGuard)
@Roles(Role.Admin)
@Controller('admin/coin')
export class AdminCoinController {
  constructor(private readonly adminCoinService: AdminCoinService) {}

  @Post('add/:userId')
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
