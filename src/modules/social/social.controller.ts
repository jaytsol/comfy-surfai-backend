import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SocialService } from './social.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('connect')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('google')
  @UseGuards(JwtAuthGuard, AuthGuard('google-youtube'))
  async connectGoogle(@Req() req) {
    // This route will redirect to Google for authentication
    // The guards ensure the user is logged into our service first,
    // then redirects them to Google.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google-youtube'))
  async googleCallback(@Req() req) {
    // The google-youtube guard has populated req.user with the Google profile and tokens.
    // We now need to associate this with the logged-in SurfAI user.
    // TODO: Pass the SurfAI user from the initial request (e.g., via state parameter)
    // For now, we pass the Google user data to the service.
    return this.socialService.handleGoogleConnection(req.user);
  }

  // TODO: Implement GET /connections
  // TODO: Implement POST /disconnect/:platform
}
