export interface IStorageService {
  uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string>;

  getFile(fileName: string): Promise<Buffer>;
  deleteFile(fileName: string): Promise<void>;
  getFileUrl(fileName: string): string;
  getSignedUrl(
    fileName: string,
    options?: GetSignedUrlOptions,
  ): Promise<string>;
}

export interface FileUploadResult {
  url: string;
  key: string;
  size: number;
  contentType: string;
}

export interface GetSignedUrlOptions {
  expiresIn?: number;
  downloadFileName?: string;
}
