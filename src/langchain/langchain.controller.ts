import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

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
