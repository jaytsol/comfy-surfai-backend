import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
      ],
      providers: [EncryptionService, ConfigService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encrypt and then decrypt a string back to the original', () => {
    const originalText = 'This is a highly secret token!';
    const encrypted = service.encrypt(originalText);
    const decrypted = service.decrypt(encrypted);

    expect(encrypted).not.toBe(originalText);
    expect(decrypted).toBe(originalText);
  });

  it('should throw an error if the encrypted text is tampered with', () => {
    const originalText = 'unmodified text';
    const encrypted = service.encrypt(originalText);
    const tamperedEncrypted = `tampered:${encrypted}`;

    expect(() => service.decrypt(tamperedEncrypted)).toThrow(
      'Invalid encrypted text format',
    );
  });
});
