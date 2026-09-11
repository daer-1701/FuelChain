import { Body, Controller, Headers, Post } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ActorRole } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
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
    private readonly auth: AuthService,
    private readonly custodyQr: CustodyQrService,
    private readonly stations: StationsService,
  ) {}

  /**
   * DEMO: emite bastón + acepta en estación CBBA en un solo paso
   * (simula chofer → encargado con/sin señal).
   */
  @Post('simulate-cbba-delivery')
  async simulate(
    @Body() dto: SimulateCbbaDto,
    @Headers('authorization') authorization?: string,
  ) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    this.auth.requireRole(token, [
      ActorRole.ADMIN,
      ActorRole.TRANSPORTER,
      ActorRole.STATION_STAFF,
      ActorRole.DEPOT_OPERATOR,
      ActorRole.AUDITOR,
      ActorRole.IMPORTER,
    ]);

    const batchCode = dto.batchCode ?? 'FC-BO-2026-000182';
    const stationCode = dto.stationCode ?? 'ST-CBB-01';
    const cisternCode = dto.cisternCode ?? 'CIS-CBB-07';
    const volumeLiters = dto.volumeLiters ?? 24800;

    const issued = await this.custodyQr.issue({
      batchCode,
      eventType: 'IN_TRANSIT',
      volumeLiters,
      cisternCode,
      stationCode,
      issuedByRole: 'TRANSPORTER',
    });

    const tokenId = (issued as { data: { tokenId: string } }).data.tokenId;
    const accepted = await this.custodyQr.accept({
      tokenId,
      consumedByRole: 'STATION_STAFF',
      stationCode,
      receivedVolumeLiters: volumeLiters - 40,
    });

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
