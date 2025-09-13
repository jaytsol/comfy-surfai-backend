import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class RagChatDto {
  @IsInt()
  @IsNotEmpty()
  documentId: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}
