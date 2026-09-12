import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { ActorRole } from '@prisma/client';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { CustodyQrService } from '../custody-qr/custody-qr.service';

class SimulateCbbaDto {
  @IsOptional()
  @IsString()
  batchCode?: string;

  @IsOptional()
  @IsString()
  stationCode?: string;

  @IsOptional()
  @IsString()
  cisternCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  volumeLiters?: number;

  @IsOptional()
  @IsNumber()
  loadDensity?: number;

  @IsOptional()
  @IsNumber()
  loadTemperature?: number;

  @IsOptional()
  loadWaterDetected?: boolean;
}

@Controller('demo')
export class DemoController {
  constructor(private readonly custodyQr: CustodyQrService) {}

  /**
   * Atajo DEMO del chofer: solo emite el bastón (viaje).
   * La recepción la confirma la estación en /q/[token] o accept.
   */
  @Post('simulate-cbba-delivery')
  @RequireRoles(...RolesAllowed.demoSimulate)
  async simulate(
    @Body() dto: SimulateCbbaDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (user.role === ActorRole.STATION_STAFF) {
      throw new BadRequestException(
        'El surtidor no simula entregas: solo recibe la cisterna en su EESS',
      );
    }

    const batchCode = dto.batchCode ?? 'FC-BO-2026-000182';
    const stationCode = dto.stationCode ?? 'ST-CBB-01';
    const cisternCode = dto.cisternCode ?? user.cisternCode ?? 'CIS-CBB-01';
    const volumeLiters = dto.volumeLiters ?? 8000;

    const issued = await this.custodyQr.issue(
      {
        batchCode,
        eventType: 'IN_TRANSIT',
        volumeLiters,
        cisternCode,
        stationCode,
        loadDensity: dto.loadDensity,
        loadTemperature: dto.loadTemperature,
        loadWaterDetected: dto.loadWaterDetected,
      },
      user,
    );

    const tokenId = (issued as { data: { tokenId: string; deepLinkPath?: string } })
      .data.tokenId;
    const deepLinkPath =
      (issued as { data: { deepLinkPath?: string } }).data.deepLinkPath ??
      `/q/${tokenId}`;

    return {
      label: 'DEMO',
      note: 'Viaje simulado: QR emitido. La estación debe aceptar el bastón (dos actores).',
      steps: [
        'Chofer genera bastón (payload en teléfono)',
        'Encargado de estación escanea / acepta en su EESS',
        'Tanque de estación y mapa se actualizan al recibir',
      ],
      issued,
      deepLinkPath,
      tokenId,
    };
  }
}
