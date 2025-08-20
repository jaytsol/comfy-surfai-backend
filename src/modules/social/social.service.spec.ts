import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialService } from './social.service';
import {
  SocialConnection,
  SocialPlatform,
} from './entities/social-connection.entity';
import { EncryptionService } from '../../common/services/encryption.service';
import { UnauthorizedException } from '@nestjs/common';

// Mocking the dependencies
const mockSocialConnectionsRepository = {
  upsert: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockEncryptionService = {
  encrypt: jest.fn(),
};

describe('SocialService', () => {
  let service: SocialService;
  let repository: Repository<SocialConnection>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        {
          provide: getRepositoryToken(SocialConnection),
          useValue: mockSocialConnectionsRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
    repository = module.get<Repository<SocialConnection>>(
      getRepositoryToken(SocialConnection),
    );
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateState', () => {
    it('should generate a state JWT with the user ID', () => {
      const userId = 1;
      mockJwtService.sign.mockReturnValue('test-state-token');
      const state = service.generateState(userId);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: userId });
      expect(state).toBe('test-state-token');
    });
  });

  describe('validateState', () => {
    it('should return userId from a valid state token', () => {
      const token = 'valid-token';
      const decoded = { sub: 1 };
      mockJwtService.verify.mockReturnValue(decoded);
      const result = service.validateState(token);
      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
      expect(result).toEqual({ userId: 1 });
    });

    it('should throw UnauthorizedException for an invalid token', () => {
      const token = 'invalid-token';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt verify error');
      });
      expect(() => service.validateState(token)).toThrow(UnauthorizedException);
    });
  });

  describe('handleGoogleConnection', () => {
    it('should correctly process and upsert the social connection', async () => {
      const state = 'valid-state';
      const googleUser = {
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
        email: 'test@google.com',
        firstName: 'Test',
        lastName: 'User',
      };
      const userId = 1;

      // Mock the validation and encryption
      jest.spyOn(service, 'validateState').mockReturnValue({ userId });
      mockEncryptionService.encrypt.mockImplementation(
        (token) => `encrypted-${token}`,
      );

      await service.handleGoogleConnection(state, googleUser);

      expect(service.validateState).toHaveBeenCalledWith(state);
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
        googleUser.accessToken,
      );
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
        googleUser.refreshToken,
      );
      expect(mockSocialConnectionsRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: userId },
          platform: SocialPlatform.YOUTUBE,
          platformUsername: 'Test User (test@google.com)',
          accessToken: 'encrypted-google-access-token',
          refreshToken: 'encrypted-google-refresh-token',
        }),
        ['platform', 'user'],
      );
    });
  });

  describe('getConnections', () => {
    it('should return an array of connected platform names', async () => {
      const userId = 1;
      const connections = [
        { platform: SocialPlatform.YOUTUBE },
        { platform: SocialPlatform.X },
      ] as SocialConnection[];

      mockSocialConnectionsRepository.find.mockResolvedValue(connections);

      const result = await service.getConnections(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        select: ['platform'],
      });
      expect(result).toEqual(['YOUTUBE', 'X']);
    });
  });

  describe('disconnectPlatform', () => {
    it('should call the delete method with correct parameters', async () => {
      const userId = 1;
      const platform = 'YOUTUBE';

      await service.disconnectPlatform(userId, platform);

      expect(repository.delete).toHaveBeenCalledWith({
        user: { id: userId },
        platform: SocialPlatform.YOUTUBE,
      });
    });
  });
});
