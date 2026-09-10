import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AnchorEvidenceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  batchCode!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(64)
  eventKind!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
