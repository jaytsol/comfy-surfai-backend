import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  Res,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IStorageService } from './interfaces/storage.interface';
import { Response } from 'express';
import { Inject } from '@nestjs/common';

@Controller('storage')
export class StorageController {
  constructor(
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const fileUrl = await this.storageService.uploadFile(
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    return {
      originalname: file.originalname,
      url: fileUrl,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Get('file/:filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const file = await this.storageService.getFile(filename);
      res.set('Content-Type', 'application/octet-stream');
      res.send(file);
    } catch (error) {
      res.status(404).send('File not found');
    }
  }

  @Delete('file/:filename')
  async deleteFile(@Param('filename') filename: string) {
    await this.storageService.deleteFile(filename);
    return { message: 'File deleted successfully' };
  }

  @Get('signed-url/:filename')
  async getSignedUrl(@Param('filename') filename: string) {
    const url = await this.storageService.getSignedUrl(filename);
    return { url };
  }
}
