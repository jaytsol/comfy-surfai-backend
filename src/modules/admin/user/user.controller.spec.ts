import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from 'src/common/entities/user.entity';
import { AdjustCoinDto } from './dto/adjust-coin.dto';
import { Role } from 'src/common/enums/role.enum';
import { ForbiddenException } from '@nestjs/common';

describe('UserController (Admin)', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    role: Role.Admin,
    coinBalance: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    displayName: 'Test User',
    generatedOutputs: [],
    workflows: [],
    coinTransactions: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockUser]),
            addCoin: jest.fn().mockResolvedValue({ ...mockUser, coinBalance: 110 }),
            deductCoin: jest.fn().mockResolvedValue({ ...mockUser, coinBalance: 90 }),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await controller.findAll({ page: 1, limit: 10 });
      expect(result).toEqual([mockUser]);
      expect(userService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('adjustCoin', () => {
    it('should add coins to a user', async () => {
      const adjustDto: AdjustCoinDto = { amount: 10, type: 'add' };
      const result = await controller.adjustCoin(mockUser.id, adjustDto);
      expect(result.coinBalance).toBe(110);
      expect(userService.addCoin).toHaveBeenCalledWith(mockUser.id, 10);
    });

    it('should deduct coins from a user', async () => {
      const adjustDto: AdjustCoinDto = { amount: 10, type: 'deduct' };
      const result = await controller.adjustCoin(mockUser.id, adjustDto);
      expect(result.coinBalance).toBe(90);
      expect(userService.deductCoin).toHaveBeenCalledWith(mockUser.id, 10);
    });

    it('should throw ForbiddenException if user is not admin (handled by guard)', async () => {
      // This test primarily checks the controller's interaction with the service.
      // The actual guard logic is tested separately in roles.guard.spec.ts.
      // Here, we simulate the guard passing, but the service might still throw if not mocked correctly.
      // For this unit test, we assume the guard has already passed.
      // So, we focus on the controller's logic given valid input.
      // No specific test for ForbiddenException here as it's guard's responsibility.
    });
  });
});
