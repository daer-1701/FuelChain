import { Body, Controller, Post } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { CustodyQrService } from '../custody-qr/custody-qr.service';
import { StationsService } from '../stations/stations.service';

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
}

@Controller('demo')
export class DemoController {
  constructor(
    private readonly custodyQr: CustodyQrService,
    private readonly stations: StationsService,
  ) {}

  /**
   * DEMO orchestrator: issue + accept in one authenticated step.
   * Real two-actor custody still goes through /custody-qr/issue and /accept.
   */
  @Post('simulate-cbba-delivery')
  @RequireRoles(...RolesAllowed.demoSimulate)
  async simulate(
    @Body() dto: SimulateCbbaDto,
    @CurrentUser() user: AuthUser,
  ) {
    const batchCode = dto.batchCode ?? 'FC-BO-2026-000182';
    const stationCode = dto.stationCode ?? 'ST-CBB-01';
    const cisternCode = dto.cisternCode ?? 'CIS-CBB-07';
    const volumeLiters = dto.volumeLiters ?? 24800;

    const issued = await this.custodyQr.issue(
      {
        batchCode,
        eventType: 'IN_TRANSIT',
        volumeLiters,
        cisternCode,
        stationCode,
      },
      user,
    );

    const tokenId = (issued as { data: { tokenId: string } }).data.tokenId;
    const accepted = await this.custodyQr.accept(
      {
        tokenId,
        stationCode,
        receivedVolumeLiters: volumeLiters - 40,
      },
      user,
    );

    const map = await this.stations.listPublic('Cochabamba');

    return {
      label: 'DEMO',
      note: 'Simulación completa CBBA: QR emitido + recepción + mapa actualizado.',
      steps: [
        'Chofer genera bastón (payload en teléfono)',
        'Encargado escanea / acepta (cola offline → sync)',
        'Tanque estación actualiza semáforo público',
      ],
      issued,
      accepted,
      map,
    };
  }
}
