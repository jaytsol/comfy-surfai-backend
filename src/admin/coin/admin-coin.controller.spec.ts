import { Test, TestingModule } from '@nestjs/testing';
import { AdminCoinController } from './admin-coin.controller';
import { AdminCoinService } from './admin-coin.service';
import { UpdateUserCoinDto } from 'src/common/dto/coin/update-user-coin.dto';
import { User } from 'src/common/entities/user.entity';
import { Role } from 'src/common/enums/role.enum';

describe('AdminCoinController', () => {
  let controller: AdminCoinController;
  let adminCoinService: AdminCoinService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    displayName: 'Test User',
    coinBalance: 1000,
    role: Role.Admin,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCoinController],
      providers: [
        {
          provide: AdminCoinService,
          useValue: {
            addCoinsToUser: jest.fn().mockResolvedValue(mockUser),
            deductCoinsFromUser: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminCoinController>(AdminCoinController);
    adminCoinService = module.get<AdminCoinService>(AdminCoinService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addCoins', () => {
    it('should call adminCoinService.addCoinsToUser and return the user', async () => {
      const userId = 1;
      const dto: UpdateUserCoinDto = { amount: 100, reason: 'Test Add' };

      const result = await controller.addCoins(userId, dto);

      expect(adminCoinService.addCoinsToUser).toHaveBeenCalledWith(
        userId,
        dto.amount,
        dto.reason,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('deductCoins', () => {
    it('should call adminCoinService.deductCoinsFromUser and return the user', async () => {
      const userId = 1;
      const dto: UpdateUserCoinDto = { amount: 50, reason: 'Test Deduct' };

      const result = await controller.deductCoins(userId, dto);

      expect(adminCoinService.deductCoinsFromUser).toHaveBeenCalledWith(
        userId,
        dto.amount,
        dto.reason,
      );
      expect(result).toEqual(mockUser);
    });
  });
});
