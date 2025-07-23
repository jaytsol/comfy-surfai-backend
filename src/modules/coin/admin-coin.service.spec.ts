import { Test, TestingModule } from '@nestjs/testing';
import { AdminCoinService } from './admin-coin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { CoinService } from 'src/coin/coin.service';
import { NotFoundException } from '@nestjs/common';
import { CoinTransactionReason } from 'src/common/entities/coin-transaction.entity';

describe('AdminCoinService', () => {
  let service: AdminCoinService;
  let userRepository: Repository<User>;
  let coinService: CoinService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    displayName: 'Test User',
    coinBalance: 1000,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCoinService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: CoinService,
          useValue: {
            addCoins: jest.fn().mockResolvedValue({ coinBalance: 1100 }),
            deductCoins: jest.fn().mockResolvedValue({ coinBalance: 900 }),
          },
        },
      ],
    }).compile();

    service = module.get<AdminCoinService>(AdminCoinService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    coinService = module.get<CoinService>(CoinService);

    jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);
    jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addCoinsToUser', () => {
    it('should add coins to a user and return the updated user', async () => {
      const userId = 1;
      const amount = 100;
      const reason = 'Admin Adjustment';

      const result = await service.addCoinsToUser(userId, amount, reason);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(coinService.addCoins).toHaveBeenCalledWith(
        userId,
        amount,
        reason as CoinTransactionReason,
      );
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: userId }); // Updated user reload
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 999;
      const amount = 100;
      const reason = 'Admin Adjustment';

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

      await expect(
        service.addCoinsToUser(userId, amount, reason),
      ).rejects.toThrow(NotFoundException);
      expect(coinService.addCoins).not.toHaveBeenCalled();
    });
  });

  describe('deductCoinsFromUser', () => {
    it('should deduct coins from a user and return the updated user', async () => {
      const userId = 1;
      const amount = 100;
      const reason = 'Admin Adjustment';

      const result = await service.deductCoinsFromUser(userId, amount, reason);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(coinService.deductCoins).toHaveBeenCalledWith(
        userId,
        amount,
        reason as CoinTransactionReason,
      );
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: userId }); // Updated user reload
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 999;
      const amount = 100;
      const reason = 'Admin Adjustment';

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

      await expect(
        service.deductCoinsFromUser(userId, amount, reason),
      ).rejects.toThrow(NotFoundException);
      expect(coinService.deductCoins).not.toHaveBeenCalled();
    });
  });
});
