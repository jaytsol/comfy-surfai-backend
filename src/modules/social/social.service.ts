import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialConnection } from './entities/social-connection.entity';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(SocialConnection)
    private readonly socialConnectionsRepository: Repository<SocialConnection>,
    private readonly jwtService: JwtService,
  ) {}

  generateState(userId: number): string {
    const payload = { sub: userId };
    return this.jwtService.sign(payload);
  }

  validateState(state: string): { userId: number } {
    try {
      const payload = this.jwtService.verify(state);
      return { userId: payload.sub };
    } catch (error) {
      throw new UnauthorizedException('Invalid state token');
    }
  }

  async handleGoogleConnection(state: string, googleUser: any) {
    const { userId } = this.validateState(state);

    // TODO: Encrypt access and refresh tokens before saving.
    const { accessToken, refreshToken, email, firstName, lastName } = googleUser;

    // TODO: Use repository to save the new social connection.
    // this.socialConnectionsRepository.upsert({ ... });

    console.log(`Handling Google connection for SurfAI user ID: ${userId}`);
    console.log('Google User Profile:', googleUser);

    return { message: 'Successfully handled Google connection' };
  }
}
