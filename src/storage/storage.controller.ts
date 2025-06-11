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
// ✨ 인증/인가 관련 import
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedGuard } from 'src/common/guards/authenticated.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import * as path from 'path'; // ✨ Node.js의 path 모듈 임포트
import { getMimeType } from 'src/common/utils/mime-type.util';

@ApiTags('Admin - Storage Management') // Swagger 태그를 관리자용으로 명시
@ApiCookieAuth() // 이 컨트롤러의 모든 API는 쿠키 인증 필요
@UseGuards(AuthenticatedGuard, RolesGuard) // ✨ 컨트롤러 전체에 가드 적용
@Roles(Role.Admin) // ✨ 이 컨트롤러의 모든 API는 Admin 역할만 사용 가능
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
    // 파일명을 그대로 사용하면 중복될 수 있으므로, 고유한 이름을 만들어주는 것이 좋습니다.
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
    console.log('req', req.params.path);
    const pathSegments = req.params.path;
    const filename = Array.isArray(pathSegments)
      ? pathSegments.join('/')
      : pathSegments;
    if (!filename || filename.includes('..')) {
      throw new BadRequestException('Invalid or malicious file path detected.');
    }

    // --- ✨ 디버깅을 위한 로그 추가 (단순화 버전) ---
    console.log('--- [DEBUG] /storage/file/* endpoint called ---');
    console.log(`Value received for 'filename' parameter: "${filename}"`);
    console.log(`Type of 'filename' parameter: ${typeof filename}`);
    // --- 디버깅 로그 끝 ---
    if (!filename) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send({ message: 'Filename parameter is required.' });
    }

    // TODO: filename에 경로 순회 공격(path traversal) 방지 로직 추가 필요
    try {
      const fileBuffer = await this.storageService.getFile(filename);
      const downloadFilename = path.basename(filename);
      const contentType = getMimeType(downloadFilename);

      // ✨ Content-Disposition 헤더를 설정하여 다운로드될 파일 이름을 지정합니다.
      // encodeURIComponent로 파일명에 특수문자가 있어도 안전하게 처리합니다.
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(downloadFilename)}`,
      );

      // mimetype을 동적으로 설정해주는 것이 더 좋습니다.
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
    const filename = req.params[0];
    // TODO: 경로 순회 공격 방지
    await this.storageService.deleteFile(filename);
    // 성공 시 204 No Content 응답
  }

  @Get('signed-url/*')
  @ApiOperation({
    summary: '파일에 대한 미리 서명된 URL을 생성합니다 (Admin 전용)',
    description:
      'URL을 생성할 파일의 전체 경로를 "signed-url/" 뒤에 이어서 요청합니다.',
  })
  async getSignedUrl(@Request() req: ExpressRequest) {
    const filename = req.params[0];
    // TODO: 경로 순회 공격 방지
    const url = await this.storageService.getSignedUrl(filename);
    return { url };
  }
}
