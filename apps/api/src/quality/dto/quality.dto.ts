import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CertificateStatus, LabResultStatus } from '@prisma/client';

export class CreateQualityCertificateDto {
  @IsString()
  @MinLength(2)
  certificateType!: string;

  @IsString()
  @MinLength(2)
  issuer!: string;

  @IsString()
  @MinLength(2)
  certificateNumber!: string;

  @IsDateString()
  issueDate!: string;

  @IsOptional()
  @IsEnum(CertificateStatus)
  status?: CertificateStatus;

  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  hash?: string;
}

export class CreateSamplingDto {
  @IsString()
  @MinLength(2)
  location!: string;

  @IsString()
  @MinLength(2)
  sampleCode!: string;

  @IsString()
  @MinLength(2)
  takenBy!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateLabAnalysisDto {
  @IsString()
  sampleId!: string;

  @IsString()
  @MinLength(2)
  laboratory!: string;

  @IsDateString()
  analysisDate!: string;

  @IsObject()
  parameters!: unknown;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsEnum(LabResultStatus)
  status?: LabResultStatus;
}
