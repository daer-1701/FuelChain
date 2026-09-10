import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustodyEventType } from '@prisma/client';

export class CreateCustodyEventDto {
  @IsEnum(CustodyEventType)
  eventType!: CustodyEventType;

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  declaredVolume?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  measuredVolume?: number;

  @IsOptional()
  @IsString()
  evidenceHash?: string;

  @IsOptional()
  @IsString()
  transactionHash?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
