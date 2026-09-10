import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AuditCaseStatus } from '@prisma/client';

export class CreateAuditCaseDto {
  @IsString()
  batchId!: string;

  @IsOptional()
  @IsString()
  anomalyId?: string;

  @IsString()
  @MinLength(4)
  title!: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  aiExplanation?: string;
}

export class AddAuditNoteDto {
  @IsString()
  @MinLength(2)
  body!: string;

  @IsOptional()
  @IsString()
  authorId?: string;
}

export class UpdateAuditStatusDto {
  @IsEnum(AuditCaseStatus)
  status!: AuditCaseStatus;
}
