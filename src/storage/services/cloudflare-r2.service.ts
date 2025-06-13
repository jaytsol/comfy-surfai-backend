import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  GetObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  GetSignedUrlOptions,
  IStorageService,
} from '../interfaces/storage.interface';
import { R2_CONFIG } from '../constants/storage.constants';

@Injectable()
export class CloudflareR2Service implements IStorageService {
  private readonly logger = new Logger(CloudflareR2Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = process.env.R2_ACCOUNT_ID || '';
    this.bucketName = process.env.R2_BUCKET_NAME || '';

    this.publicUrl =
      process.env.R2_PUBLIC_URL ||
      R2_CONFIG.PUBLIC_URL(this.bucketName, accountId);

    this.s3Client = new S3Client({
      region: R2_CONFIG.REGION,
      endpoint: R2_CONFIG.ENDPOINT(accountId),
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      const fileUrl = this.getFileUrl(fileName);
      this.logger.debug(`File uploaded successfully: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      const errorMessage = `Failed to upload file ${fileName}: ${error.message}`;
      this.logger.error(errorMessage, error.stack);
      throw new Error(errorMessage);
    }
  }

  async getFile(fileName: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('Empty response body');
      }

      const chunks: Buffer[] = [];
      for await (const chunk of response.Body as AsyncIterable<Buffer>) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      const errorMessage = `Failed to get file ${fileName}: ${error.message}`;
      this.logger.error(errorMessage, error.stack);
      throw new Error(errorMessage);
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await this.s3Client.send(command);
      this.logger.debug(`File deleted successfully: ${fileName}`);
    } catch (error) {
      const errorMessage = `Failed to delete file ${fileName}: ${error.message}`;
      this.logger.error(errorMessage, error.stack);
      throw new Error(errorMessage);
    }
  }

  getFileUrl(fileName: string): string {
    return `${this.publicUrl}/${encodeURIComponent(fileName)}`;
  }

  async getSignedUrl(
    fileName: string,
    options: GetSignedUrlOptions = {},
  ): Promise<string> {
    try {
      const { downloadFileName, expiresIn = 3600 } = options;

      const commandInput: GetObjectCommandInput = {
        Bucket: this.bucketName,
        Key: fileName,
      };

      if (downloadFileName) {
        commandInput.ResponseContentDisposition = `attachment; filename*=UTF-8''${encodeURIComponent(downloadFileName)}`;
      }

      const command = new GetObjectCommand(commandInput);
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      const errorMessage = `Failed to generate signed URL for ${fileName}: ${error.message}`;
      this.logger.error(errorMessage, error.stack);
      throw new Error(errorMessage);
    }
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }
}
