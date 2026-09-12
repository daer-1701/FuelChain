import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { CisternsService } from './cisterns.service';

class ScanIngestDto {
  @IsOptional()
  @IsArray()
  samples?: Array<Record<string, unknown>>;

  @IsOptional()
  @IsString()
  note?: string;
}

class ReceiveDto {
  @IsOptional()
  @IsNumber()
  receivedVolumeLiters?: number;

  @IsOptional()
  @IsNumber()
  receivedDensity?: number;

  @IsOptional()
  @IsNumber()
  receivedTemperature?: number;

  @IsOptional()
  @IsBoolean()
  receivedWaterDetected?: boolean;
}

@Controller('c')
export class CisternsController {
  constructor(private readonly cisterns: CisternsService) {}

  /** Catálogo de stickers QR DEMO para prueba (50). */
  @Get()
  list() {
    return this.cisterns.listStickers(50);
  }

  /** Lectura del sticker permanente (sin auth) — ficha + historial ya persistido. */
  @Get(':qrToken')
  get(@Param('qrToken') qrToken: string) {
    return this.cisterns.getByQr(qrToken);
  }

  /** Estación escanea → sube buffer del dispositivo / trail DEMO. */
  @Post(':qrToken/scan')
  @RequireRoles(...RolesAllowed.qrSync)
  scan(
    @Param('qrToken') qrToken: string,
    @Body() dto: ScanIngestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.cisterns.scanAndIngest(qrToken, user, {
      samples: dto.samples as never,
      note: dto.note,
    });
  }

  /** Confirma recepción en tanque tras haber subido el camino. */
  @Post(':qrToken/receive')
  @RequireRoles(...RolesAllowed.qrAccept)
  receive(
    @Param('qrToken') qrToken: string,
    @Body() dto: ReceiveDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.cisterns.receiveAfterScan(qrToken, user, dto);
  }
}
