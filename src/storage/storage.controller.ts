// src/storage/storage.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Res,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { IStorageService } from './interfaces/storage.interface';
import { Inject } from '@nestjs/common';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedGuard } from 'src/common/guards/authenticated.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import * as path from 'path';
import { getMimeType } from 'src/common/utils/mime-type.util';

@ApiTags('Admin - Storage Management')
@ApiCookieAuth()
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('storage')
export class StorageController {
  constructor(
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '파일을 직접 스토리지에 업로드합니다 (Admin 전용)' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const fileName = `${uuidv4()}-${file.originalname}`;
    const fileUrl = await this.storageService.uploadFile(
      fileName,
      file.buffer,
      file.mimetype,
    );
    return { originalname: file.originalname, url: fileUrl, size: file.size };
  }

  @Get('file/*')
  @ApiOperation({
    summary: '스토리지의 파일을 직접 다운로드합니다 (Admin 전용)',
    description:
      '파일의 전체 경로를 "file/" 뒤에 이어서 요청합니다. 예: /storage/file/outputs/4/prompt-id-123/image.png',
  })
  @ApiResponse({ status: 200, description: '파일 다운로드 성공' })
  @ApiResponse({ status: 404, description: '파일을 찾을 수 없음' })
  async getFile(@Request() req: ExpressRequest, @Res() res: Response) {
    const pathSegments = req.params.path;
    const filename = Array.isArray(pathSegments)
      ? pathSegments.join('/')
      : pathSegments;
    if (!filename || filename.includes('..')) {
      throw new BadRequestException('Invalid or malicious file path detected.');
    }

    if (!filename) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send({ message: 'Filename parameter is required.' });
    }

    try {
      const fileBuffer = await this.storageService.getFile(filename);
      const downloadFilename = path.basename(filename);
      const contentType = getMimeType(downloadFilename);

      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(downloadFilename)}`,
      );

      res.setHeader('Content-Type', contentType);
      res.send(fileBuffer);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).send({ message: 'File not found' });
    }
  }

  @Delete('file/*')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '스토리지의 파일을 직접 삭제합니다 (Admin 전용)',
    description: '삭제할 파일의 전체 경로를 "file/" 뒤에 이어서 요청합니다.',
  })
  async deleteFile(@Request() req: ExpressRequest) {
    const pathSegments = req.params.path;
    const filename = Array.isArray(pathSegments)
      ? pathSegments.join('/')
      : pathSegments;

    if (!filename || filename.includes('..')) {
      throw new BadRequestException('Invalid or malicious file path detected.');
    }

    await this.storageService.deleteFile(filename);
  }

  @Get('signed-url/*')
  @ApiOperation({
    summary: '파일에 대한 미리 서명된 URL을 생성합니다 (Admin 전용)',
    description:
      'URL을 생성할 파일의 전체 경로를 "signed-url/" 뒤에 이어서 요청합니다.',
  })
  async getSignedUrl(@Request() req: ExpressRequest) {
    const pathSegments = req.params.path;
    const filename = Array.isArray(pathSegments)
      ? pathSegments.join('/')
      : pathSegments;

    if (!filename || filename.includes('..')) {
      throw new BadRequestException('Invalid or malicious file path detected.');
    }

    const url = await this.storageService.getSignedUrl(filename);
    return { url };
  }
}
