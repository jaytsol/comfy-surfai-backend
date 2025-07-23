import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/common/entities/user.entity';
import { AdjustCoinDto } from './dto/adjust-coin.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Admin - User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '모든 사용자 목록 조회 (관리자 전용)' })
  @ApiResponse({ status: 200, description: '사용자 목록 반환', type: [User] })
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Post(':id/coin')
  @ApiOperation({ summary: '사용자 코인 조정 (관리자 전용)' })
  @ApiResponse({ status: 200, description: '코인 조정 성공', type: User })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async adjustCoin(
    @Param('id', ParseIntPipe) id: number,
    @Body() adjustCoinDto: AdjustCoinDto,
  ): Promise<User> {
    const { amount, type } = adjustCoinDto;
    if (type === 'add') {
      return this.userService.addCoin(id, amount);
    } else {
      return this.userService.deductCoin(id, amount);
    }
  }
}
