import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('langchain')
export class LangchainController {
  constructor(private readonly langchainService: LangchainService) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@Body() createChatDto: CreateChatDto) {
    const response = await this.langchainService.chat(createChatDto.prompt);
    return { response };
  }
}
