import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreateDocumentDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsString()
  @MinLength(2)
  storageUrl!: string;

  @IsString()
  @MinLength(16)
  sha256Hash!: string;

  @IsOptional()
  @IsString()
  uploadedById?: string;

  @IsOptional()
  @IsString()
  blockchainTxHash?: string;
}
