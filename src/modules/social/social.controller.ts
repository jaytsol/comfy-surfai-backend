import { Controller } from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // TODO: Implement GET /connections
  // TODO: Implement GET /connect/:platform
  // TODO: Implement GET /connect/:platform/callback
  // TODO: Implement POST /disconnect/:platform
}
