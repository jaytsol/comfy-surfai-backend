import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { CoinService } from 'src/coin/coin.service';
import { NotFoundException } from '@nestjs/common';
import { CoinTransactionReason } from 'src/common/entities/coin-transaction.entity';
import { Role } from 'src/common/enums/role.enum';

describe('UserService (Admin)', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let coinService: CoinService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    role: Role.User,
    coinBalance: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    displayName: 'Test User',
    generatedOutputs: [],
    workflows: [],
    coinTransactions: [],
    socialConnections: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: CoinService,
          useValue: {
            addCoins: jest
              .fn()
              .mockResolvedValue({ ...mockUser, coinBalance: 110 }),
            deductCoins: jest
              .fn()
              .mockResolvedValue({ ...mockUser, coinBalance: 90 }),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    coinService = module.get<CoinService>(CoinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users sorted by ID', async () => {
      const users = [
        { ...mockUser, id: 2 },
        { ...mockUser, id: 1 },
      ];
      jest
        .spyOn(userRepository, 'findAndCount')
        .mockResolvedValue([users.sort((a, b) => a.id - b.id), users.length]);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toEqual(users.sort((a, b) => a.id - b.id));
      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        order: { id: 'DESC' },
        take: 10,
        skip: 0,
      });
    });
  });

  describe('addCoin', () => {
    it('should add coins to a user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      const result = await service.addCoin(mockUser.id, 10);
      expect(result.coinBalance).toBe(110);
      expect(coinService.addCoins).toHaveBeenCalledWith(
        mockUser.id,
        10,
        CoinTransactionReason.ADMIN_ADJUSTMENT,
      );
    });

    it('should throw NotFoundException if user not found when adding coins', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      await expect(service.addCoin(999, 10)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deductCoin', () => {
    it('should deduct coins from a user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      const result = await service.deductCoin(mockUser.id, 10);
      expect(result.coinBalance).toBe(90);
      expect(coinService.deductCoins).toHaveBeenCalledWith(
        mockUser.id,
        10,
        CoinTransactionReason.ADMIN_ADJUSTMENT,
      );
    });

    it('should throw NotFoundException if user not found when deducting coins', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      await expect(service.deductCoin(999, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
