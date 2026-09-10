import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnomalySeverity, AnomalyStatus, AnomalyType } from '@prisma/client';

export class ListAnomaliesQueryDto {
  @IsOptional()
  @IsEnum(AnomalyStatus)
  status?: AnomalyStatus;

  @IsOptional()
  @IsEnum(AnomalySeverity)
  severity?: AnomalySeverity;

  @IsOptional()
  @IsString()
  batchId?: string;
}

export class UpdateAnomalyStatusDto {
  @IsEnum(AnomalyStatus)
  status!: AnomalyStatus;
}

export class CreateAnomalyDto {
  @IsString()
  batchId!: string;

  @IsEnum(AnomalyType)
  type!: AnomalyType;

  @IsOptional()
  @IsEnum(AnomalySeverity)
  severity?: AnomalySeverity;

  @IsOptional()
  @IsString()
  expected?: string;

  @IsOptional()
  @IsString()
  actual?: string;

  @IsOptional()
  @IsString()
  difference?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  riskImpact?: number;

  @IsOptional()
  @IsString()
  @MinLength(8)
  explanation?: string;
}
