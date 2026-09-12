import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CheckpointKind } from '@prisma/client';

export class CreateCheckpointDto {
  @IsEnum(CheckpointKind)
  kind!: CheckpointKind;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  deliveryId?: string;

  @IsOptional()
  @IsString()
  cisternCode?: string;

  @IsOptional()
  @IsString()
  batchCode?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  volumeLiters!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  density?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  temperature?: number;

  @IsOptional()
  @IsBoolean()
  waterDetected?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accuracyMeters?: number;

  @IsOptional()
  @IsString()
  clientEventId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  note?: string;
}
