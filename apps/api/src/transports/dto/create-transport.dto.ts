import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TransportStatus, TransportType } from '@prisma/client';

export class CreateTransportDto {
  @IsEnum(TransportType)
  transportType!: TransportType;

  @IsString()
  @MinLength(2)
  carrier!: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  vehicleRef?: string;

  @IsString()
  @MinLength(2)
  origin!: string;

  @IsString()
  @MinLength(2)
  destination!: string;

  @IsOptional()
  @IsDateString()
  departureAt?: string;

  @IsOptional()
  @IsDateString()
  arrivalAt?: string;

  @IsOptional()
  @IsEnum(TransportStatus)
  status?: TransportStatus;
}
