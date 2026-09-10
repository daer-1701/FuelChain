import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MeasurementSource, TankStatus } from '@prisma/client';

export class CreateTankDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  capacityLiters!: number;

  @IsString()
  @MinLength(2)
  location!: string;

  @IsOptional()
  @IsEnum(TankStatus)
  status?: TankStatus;
}

export class CreateMeasurementDto {
  @IsString()
  tankId!: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsString()
  @MinLength(2)
  deviceId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  volumeLiters!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  temperature?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsEnum(MeasurementSource)
  source!: MeasurementSource;
}
