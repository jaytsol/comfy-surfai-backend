// src/storage/storage.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  Res,
  Delete,
  UseGuards, // ✨ UseGuards 추가
  HttpCode, // ✨ HttpCode, HttpStatus 추가
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IStorageService } from './interfaces/storage.interface';
import { Response } from 'express';
import { Inject } from '@nestjs/common';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

// ✨ 인증/인가 관련 import
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedGuard } from 'src/common/guards/authenticated.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

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

  @Get('file/:filename')
  @ApiOperation({
    summary: '스토리지의 파일을 직접 다운로드합니다 (Admin 전용)',
  })
  @ApiParam({
    name: 'filename',
    description: 'R2에 저장된 파일의 전체 경로/이름',
  })
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    // TODO: filename에 경로 순회 공격(path traversal) 방지 로직 추가 필요
    try {
      const fileBuffer = await this.storageService.getFile(filename);
      // mimetype을 동적으로 설정해주는 것이 더 좋습니다.
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(fileBuffer);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).send({ message: 'File not found' });
    }
  }

  @Delete('file/:filename')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '스토리지의 파일을 직접 삭제합니다 (Admin 전용)' })
  @ApiParam({ name: 'filename', description: '삭제할 파일의 전체 경로/이름' })
  async deleteFile(@Param('filename') filename: string) {
    // TODO: 경로 순회 공격 방지
    await this.storageService.deleteFile(filename);
    // 성공 시 204 No Content 응답
  }

  @Get('signed-url/:filename')
  @ApiOperation({
    summary: '파일에 대한 미리 서명된 URL을 생성합니다 (Admin 전용)',
  })
  @ApiParam({
    name: 'filename',
    description: 'URL을 생성할 파일의 전체 경로/이름',
  })
  async getSignedUrl(@Param('filename') filename: string) {
    // TODO: 경로 순회 공격 방지
    const url = await this.storageService.getSignedUrl(filename);
    return { url };
  }
}
