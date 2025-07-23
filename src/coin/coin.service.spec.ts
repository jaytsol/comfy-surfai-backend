import { Test, TestingModule } from '@nestjs/testing';
import { CoinService } from './coin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../common/entities/user.entity';
import {
  CoinTransaction,
  CoinTransactionType,
  CoinTransactionReason,
} from '../common/entities/coin-transaction.entity';
import { Repository, DataSource } from 'typeorm';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'; // 추가

describe('CoinService', () => {
  let service: CoinService;
  let userRepository: Repository<User>;
  let coinTransactionRepository: Repository<CoinTransaction>;
  let dataSource: DataSource;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    displayName: 'Test User',
    coinBalance: 0,
  } as User;

  const mockCoinTransaction = {
    id: 1,
    userId: 1,
    type: CoinTransactionType.GAIN,
    amount: 100,
    reason: CoinTransactionReason.PROMOTION,
    currentBalance: 100,
  } as CoinTransaction;

  beforeEach(async () => {
    // mockUser 초기화
    mockUser.coinBalance = 0;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(CoinTransaction),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                findOne: jest.fn().mockResolvedValue(mockUser),
                save: jest.fn((entity) => {
                  if (entity instanceof User) {
                    return Promise.resolve(entity);
                  } else if (entity instanceof CoinTransaction) {
                    return Promise.resolve(entity);
                  }
                  return Promise.resolve(entity);
                }),
                create: jest.fn().mockImplementation((entity, dto) => dto),
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CoinService>(CoinService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    coinTransactionRepository = module.get<Repository<CoinTransaction>>(
      getRepositoryToken(CoinTransaction),
    );
    dataSource = module.get<DataSource>(DataSource);

    // Mocking repository methods
    jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
    jest
      .spyOn(userRepository, 'save')
      .mockImplementation((user) => Promise.resolve(user as User));
    jest
      .spyOn(coinTransactionRepository, 'create')
      .mockImplementation((transaction) => transaction as CoinTransaction);
    jest
      .spyOn(coinTransactionRepository, 'save')
      .mockImplementation((transaction) =>
        Promise.resolve(transaction as CoinTransaction),
      );
    jest
      .spyOn(coinTransactionRepository, 'find')
      .mockResolvedValue([mockCoinTransaction]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addCoins', () => {
    it('should add coins to user balance and record transaction', async () => {
      const initialBalance = mockUser.coinBalance;
      const amountToAdd = 50;
      const reason = CoinTransactionReason.PROMOTION;

      const updatedUser = await service.addCoins(
        mockUser.id,
        amountToAdd,
        reason,
      );

      expect(updatedUser.coinBalance).toBe(initialBalance + amountToAdd);
      expect(
        dataSource.createQueryRunner().startTransaction,
      ).toHaveBeenCalled();
      expect(dataSource.createQueryRunner().manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockUser,
          coinBalance: initialBalance + amountToAdd,
        }),
      );
      expect(dataSource.createQueryRunner().manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          type: CoinTransactionType.GAIN,
          amount: amountToAdd,
          reason: reason,
          currentBalance: initialBalance + amountToAdd,
        }),
      );
      expect(
        dataSource.createQueryRunner().commitTransaction,
      ).toHaveBeenCalled();
    });

    it('should throw BadRequestException if amount is not positive', async () => {
      await expect(
        service.addCoins(mockUser.id, 0, CoinTransactionReason.PROMOTION),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback transaction on error', async () => {
      jest
        .spyOn(dataSource.createQueryRunner().manager, 'save')
        .mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.addCoins(mockUser.id, 50, CoinTransactionReason.PROMOTION),
      ).rejects.toThrow(InternalServerErrorException);
      expect(
        dataSource.createQueryRunner().rollbackTransaction,
      ).toHaveBeenCalled();
    });
  });

  describe('deductCoins', () => {
    it('should deduct coins from user balance and record transaction', async () => {
      mockUser.coinBalance = 100; // Set initial balance for deduction test
      const amountToDeduct = 30;
      const reason = CoinTransactionReason.IMAGE_GENERATION;

      const updatedUser = await service.deductCoins(
        mockUser.id,
        amountToDeduct,
        reason,
      );

      expect(updatedUser.coinBalance).toBe(100 - amountToDeduct);
      expect(
        dataSource.createQueryRunner().startTransaction,
      ).toHaveBeenCalled();
      expect(dataSource.createQueryRunner().manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockUser,
          coinBalance: 100 - amountToDeduct,
        }),
      );
      expect(dataSource.createQueryRunner().manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          type: CoinTransactionType.DEDUCT,
          amount: amountToDeduct,
          reason: reason,
          currentBalance: 100 - amountToDeduct,
        }),
      );
      expect(
        dataSource.createQueryRunner().commitTransaction,
      ).toHaveBeenCalled();
    });

    it('should throw BadRequestException if amount is not positive', async () => {
      await expect(
        service.deductCoins(
          mockUser.id,
          0,
          CoinTransactionReason.IMAGE_GENERATION,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if coin balance is insufficient', async () => {
      mockUser.coinBalance = 10; // Set insufficient balance
      await expect(
        service.deductCoins(
          mockUser.id,
          50,
          CoinTransactionReason.IMAGE_GENERATION,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback transaction on error', async () => {
      mockUser.coinBalance = 100; // 충분한 잔액 설정
      jest
        .spyOn(dataSource.createQueryRunner().manager, 'save')
        .mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.deductCoins(
          mockUser.id,
          50,
          CoinTransactionReason.IMAGE_GENERATION,
        ),
      ).rejects.toThrow(InternalServerErrorException);
      expect(
        dataSource.createQueryRunner().rollbackTransaction,
      ).toHaveBeenCalled();
    });
  });

  describe('getBalance', () => {
    it('should return user coin balance', async () => {
      mockUser.coinBalance = 200;
      const balance = await service.getBalance(mockUser.id);
      expect(balance).toBe(200);
    });

    it('should throw BadRequestException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);
      await expect(service.getBalance(999)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTransactions', () => {
    it('should return user coin transactions', async () => {
      const transactions = await service.getTransactions(mockUser.id);
      expect(transactions).toEqual([mockCoinTransaction]);
      expect(coinTransactionRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
