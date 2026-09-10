import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  @MinLength(2)
  identifier!: string;

  @IsOptional()
  @IsString()
  plate?: string;

  @IsString()
  @MinLength(2)
  carrier!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  capacityLiters?: number;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
