import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SocialService } from './social.service';

@Controller('connect')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('google')
  @UseGuards(AuthGuard('google-youtube'))
  async connectGoogle(@Req() req) {
    // This route will redirect to Google for authentication
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google-youtube'))
  async googleCallback(@Req() req) {
    // The AuthGuard will handle the logic, and the user object will be on req.user
    // Next, we will pass this to the service to save the connection details.
    // For now, we can just return a success message.
    return { message: 'Google account connected successfully' };
  }

  // TODO: Implement GET /connections
  // TODO: Implement POST /disconnect/:platform
}
