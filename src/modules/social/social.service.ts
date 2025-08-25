import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SocialConnection,
  SocialPlatform,
} from './entities/social-connection.entity';
import { EncryptionService } from '../../common/services/encryption.service';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(SocialConnection)
    private readonly socialConnectionsRepository: Repository<SocialConnection>,
    private readonly jwtService: JwtService,
    private readonly encryptionService: EncryptionService,
  ) {}

  generateState(userId: number): string {
    const payload = { sub: userId };
    return this.jwtService.sign(payload);
  }

  validateState(state: string): { userId: number } {
    try {
      const payload = this.jwtService.verify(state);
      return { userId: payload.sub };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Invalid state token');
    }
  }

  async handleGoogleConnection(state: string, googleUser: any) {
    const { userId } = this.validateState(state);
    const { accessToken, refreshToken, email, firstName, lastName } =
      googleUser;

    const encryptedAccessToken = this.encryptionService.encrypt(accessToken);
    const encryptedRefreshToken = refreshToken
      ? this.encryptionService.encrypt(refreshToken)
      : null;

    const connectionToSave = {
      user: { id: userId },
      platform: SocialPlatform.YOUTUBE,
      platformUsername: `${firstName} ${lastName} (${email})`,
      accessToken: encryptedAccessToken,
      connectedAt: new Date(),
      // Only include refreshToken if it exists
      ...(encryptedRefreshToken && { refreshToken: encryptedRefreshToken }),
    };

    await this.socialConnectionsRepository.upsert(connectionToSave, [
      'platform',
      'user',
    ]);

    return { message: 'Successfully handled Google connection' };
  }

  async getConnections(userId: number): Promise<SocialPlatform[]> {
    const connections = await this.socialConnectionsRepository.find({
      where: { user: { id: userId } },
      select: ['platform'],
    });
    return connections.map((c) => c.platform);
  }

  async disconnectPlatform(userId: number, platform: string): Promise<void> {
    const platformEnum = platform.toUpperCase() as SocialPlatform;

    // Optional: Check if the platform is a valid enum value
    if (!Object.values(SocialPlatform).includes(platformEnum)) {
      throw new Error(`Invalid platform: ${platform}`);
    }

    await this.socialConnectionsRepository.delete({
      user: { id: userId },
      platform: platformEnum,
    });
  }
}
