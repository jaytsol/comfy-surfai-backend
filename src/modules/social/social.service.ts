import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialConnection } from './entities/social-connection.entity';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(SocialConnection)
    private readonly socialConnectionsRepository: Repository<SocialConnection>,
  ) {}

  // TODO: Implement business logic for social connections
}
