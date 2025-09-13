import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RagDocument,
  RagDocumentStatus,
} from '../../common/entities/rag-document.entity';
import { User } from '../../common/entities/user.entity';
import { LangchainService } from '../../langchain/langchain.service';
import { RagChatDto } from './dto/rag-chat.dto';
import { IStorageService } from '../../storage/interfaces/storage.interface';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class RagService {
  constructor(
    @InjectRepository(RagDocument)
    private readonly ragDocumentRepository: Repository<RagDocument>,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
    private readonly langchainService: LangchainService,
  ) {}

  async getDocumentsForUser(user: User): Promise<RagDocument[]> {
    const documents = await this.ragDocumentRepository.find({
      where: { ownerUserId: user.id },
      order: { createdAt: 'DESC' },
    });

    // Return public URLs for the frontend
    return documents.map((doc) => ({
      ...doc,
      r2Url: this.storageService.getFileUrl(doc.r2Url),
    }));
  }

  async uploadDocument(
    file: Express.Multer.File,
    user: User,
  ): Promise<RagDocument> {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    // 1. Create a unique file name and upload to R2
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension);
    const uniqueFileName = `${baseName}-${randomUUID()}${fileExtension}`;
    const uploadPath = path.join(`rag-documents/${user.id}`, uniqueFileName);

    await this.storageService.uploadFile(
      uploadPath,
      file.buffer,
      file.mimetype,
    );

    // 2. Save metadata to DB
    const newDocument = this.ragDocumentRepository.create({
      ownerUserId: user.id,
      originalFilename: file.originalname,
      r2Url: uploadPath, // Store the path, not the full public URL
      mimeType: file.mimetype,
      status: RagDocumentStatus.UPLOADED,
    });

    const savedDocument = await this.ragDocumentRepository.save(newDocument);

    // 3. Trigger async processing (don't await)
    void this.langchainService
      .processRagDocument(savedDocument.id, uploadPath)
      .catch((err) => {
        console.error(`Failed to process document ${savedDocument.id}:`, err);
        void this.ragDocumentRepository.update(savedDocument.id, {
          status: RagDocumentStatus.ERROR,
        });
      });

    // 4. Update status to PROCESSING immediately
    await this.ragDocumentRepository.update(savedDocument.id, {
      status: RagDocumentStatus.PROCESSING,
    });

    // Return the full document info, including the public URL for immediate use if needed
    return {
      ...savedDocument,
      r2Url: this.storageService.getFileUrl(uploadPath),
    };
  }

  async chat(ragChatDto: RagChatDto, user: User): Promise<any> {
    const { documentId, message } = ragChatDto;

    // 1. Find and validate the document
    const document = await this.ragDocumentRepository.findOneBy({
      id: documentId,
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found.`);
    }

    if (document.ownerUserId !== user.id) {
      throw new ForbiddenException('You do not have access to this document.');
    }

    // 2. Check document status
    if (document.status !== RagDocumentStatus.READY) {
      let statusMessage = 'Document is not ready.';
      if (document.status === RagDocumentStatus.PROCESSING)
        statusMessage =
          'Document is still being processed. Please try again later.';
      if (document.status === RagDocumentStatus.ERROR)
        statusMessage = 'There was an error processing this document.';
      if (document.status === RagDocumentStatus.UPLOADED)
        statusMessage = 'Document is pending processing.';
      throw new BadRequestException(statusMessage);
    }

    // 3. Forward to Langchain service
    return this.langchainService.queryRagDocument(documentId, message);
  }
}
