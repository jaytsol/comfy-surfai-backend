import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RagService } from './rag.service';
import { RagChatDto } from './dto/rag-chat.dto';
import { User } from '../../common/entities/user.entity';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('rag')
@UseGuards(JwtAuthGuard)
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Req() req) {
    const user = req.user as User;
    return this.ragService.uploadDocument(file, user);
  }

  @Post('chat')
  async chat(@Body() ragChatDto: RagChatDto, @Req() req) {
    const user = req.user as User;
    return this.ragService.chat(ragChatDto, user);
  }
}
