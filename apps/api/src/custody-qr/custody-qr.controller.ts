import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CustodyQrService } from './custody-qr.service';

class IssueBatonDto {
  @IsString()
  batchCode!: string;

  @IsString()
  eventType!: string;

  @IsNumber()
  @Min(0)
  volumeLiters!: number;

  @IsOptional()
  @IsString()
  cisternCode?: string;

  @IsOptional()
  @IsString()
  stationCode?: string;

  @IsString()
  issuedByRole!: string;

  @IsOptional()
  @IsString()
  previousHash?: string;
}

class AcceptBatonDto {
  @IsOptional()
  @IsString()
  tokenId?: string;

  @IsOptional()
  embedded?: Record<string, unknown>;

  @IsString()
  consumedByRole!: string;

  @IsOptional()
  @IsString()
  stationCode?: string;

  @IsOptional()
  @IsNumber()
  receivedVolumeLiters?: number;
}

class SyncOfflineDto {
  events!: Array<{
    clientEventId: string;
    batonTokenId?: string;
    batchCode?: string;
    stationCode?: string;
    actorRole: string;
    eventType: string;
    payload: Record<string, unknown>;
    capturedAt: string;
  }>;
}

@Controller('custody-qr')
export class CustodyQrController {
  constructor(private readonly custodyQr: CustodyQrService) {}

  @Post('issue')
  issue(@Body() dto: IssueBatonDto) {
    return this.custodyQr.issue(dto);
  }

  @Get(':tokenId')
  get(@Param('tokenId') tokenId: string) {
    return this.custodyQr.getBaton(tokenId);
  }

  @Post('accept')
  accept(@Body() dto: AcceptBatonDto) {
    return this.custodyQr.accept(dto);
  }

  @Post('sync')
  sync(@Body() dto: SyncOfflineDto) {
    return this.custodyQr.syncOffline(dto.events ?? []);
  }
}
