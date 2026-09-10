import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCustomsEventDto {
  @IsString()
  @MinLength(2)
  eventType!: string;

  @IsString()
  @MinLength(2)
  location!: string;

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
  actorId?: string;

  @IsOptional()
  @IsString()
  documentId?: string;
}
