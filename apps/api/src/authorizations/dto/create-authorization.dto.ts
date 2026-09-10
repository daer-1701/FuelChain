import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { AuthorizationStatus } from '@prisma/client';

export class CreateAuthorizationDto {
  @IsString()
  @MinLength(2)
  authorizationType!: string;

  @IsString()
  @MinLength(2)
  referenceNumber!: string;

  @IsString()
  @MinLength(2)
  issuer!: string;

  @IsOptional()
  @IsEnum(AuthorizationStatus)
  status?: AuthorizationStatus;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  documentId?: string;
}
