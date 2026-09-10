import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BatchStatus, QualityStatus, RiskLevel } from '@prisma/client';

export class CreateBatchDto {
  @IsOptional()
  @IsString()
  batchCode?: string;

  @IsString()
  @MinLength(2)
  product!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  declaredVolumeLiters!: number;

  @IsString()
  @MinLength(2)
  originCountry!: string;

  @IsString()
  @MinLength(2)
  destination!: string;

  @IsString()
  @MinLength(2)
  supplier!: string;

  @IsString()
  @MinLength(2)
  importer!: string;

  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @IsOptional()
  @IsString()
  currentLocation?: string;

  @IsOptional()
  @IsBoolean()
  isDemo?: boolean;
}

export class UpdateBatchDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  product?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  declaredVolumeLiters?: number;

  @IsOptional()
  @IsString()
  originCountry?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  importer?: string;

  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  riskScore?: number;

  @IsOptional()
  @IsEnum(QualityStatus)
  qualityStatus?: QualityStatus;

  @IsOptional()
  @IsString()
  currentLocation?: string;
}

export class ListBatchesQueryDto {
  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @IsOptional()
  @IsEnum(RiskLevel)
  risk?: RiskLevel;

  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  q?: string; // batchCode search

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 20;
}
