import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { CustodyQrService } from './custody-qr.service';

class IssueBatonDto {
  @IsString()
  batchCode!: string;

  @IsString()
  eventType!: string;

  @IsNumber()
  @Min(0.001)
  volumeLiters!: number;

  @IsOptional()
  @IsString()
  cisternCode?: string;

  @IsOptional()
  @IsString()
  stationCode?: string;

  /** @deprecated Ignored — issuer role comes from the session. */
  @IsOptional()
  @IsString()
  issuedByRole?: string;

  @IsOptional()
  @IsString()
  previousHash?: string;
}

class AcceptBatonDto {
  @IsOptional()
  @IsString()
  tokenId?: string;

  @IsOptional()
  @IsObject()
  embedded?: Record<string, unknown>;

  /** @deprecated Ignored — consumer role comes from the session. */
  @IsOptional()
  @IsString()
  consumedByRole?: string;

  @IsOptional()
  @IsString()
  stationCode?: string;

  @IsOptional()
  @IsNumber()
  receivedVolumeLiters?: number;

  @IsOptional()
  @IsString()
  clientEventId?: string;
}

class SyncOfflineDto {
  events!: Array<{
    clientEventId: string;
    batonTokenId?: string;
    batchCode?: string;
    stationCode?: string;
    actorRole?: string;
    eventType: string;
    payload: Record<string, unknown>;
    capturedAt: string;
  }>;
}

@Controller('custody-qr')
export class CustodyQrController {
  constructor(private readonly custodyQr: CustodyQrService) {}

  @Post('issue')
  @RequireRoles(...RolesAllowed.qrIssue)
  issue(@Body() dto: IssueBatonDto, @CurrentUser() user: AuthUser) {
    return this.custodyQr.issue(
      {
        batchCode: dto.batchCode,
        eventType: dto.eventType,
        volumeLiters: dto.volumeLiters,
        cisternCode: dto.cisternCode,
        stationCode: dto.stationCode,
        previousHash: dto.previousHash,
      },
      user,
    );
  }

  @Get(':tokenId')
  get(@Param('tokenId') tokenId: string) {
    return this.custodyQr.getBaton(tokenId);
  }

  @Post('accept')
  @RequireRoles(...RolesAllowed.qrAccept)
  accept(@Body() dto: AcceptBatonDto, @CurrentUser() user: AuthUser) {
    return this.custodyQr.accept(
      {
        tokenId: dto.tokenId,
        embedded: dto.embedded,
        stationCode: dto.stationCode,
        receivedVolumeLiters: dto.receivedVolumeLiters,
        clientEventId: dto.clientEventId,
      },
      user,
    );
  }

  @Post('sync')
  @RequireRoles(...RolesAllowed.qrSync)
  sync(@Body() dto: SyncOfflineDto, @CurrentUser() user: AuthUser) {
    return this.custodyQr.syncOffline(dto.events ?? [], user);
  }
}
