import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ActorRole } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { BlockchainService } from './blockchain.service';
import { AnchorEvidenceDto } from './dto/anchor-evidence.dto';

@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly blockchain: BlockchainService,
    private readonly auth: AuthService,
  ) {}

  @Get('anchors')
  async list(
    @Query('batchId') batchId?: string,
    @Query('stationCode') stationCode?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    let stationId: string | null = null;
    let scopedCode: string | null = stationCode?.trim() || null;

    if (token) {
      try {
        const user = await this.auth.resolveUser(token);
        if (user.role === ActorRole.STATION_STAFF) {
          // Estación: siempre solo su EESS (ignora query ajena).
          stationId = user.stationId ?? null;
          scopedCode = user.stationCode ?? null;
        }
      } catch {
        /* listado público ANH / sin login */
      }
    }

    return this.blockchain.listAnchors({
      batchId,
      stationId,
      stationCode: stationId ? null : scopedCode,
    });
  }

  @Get('status')
  status() {
    return this.blockchain.getStatus();
  }

  @Get('verify-evidence/:custodyEventId')
  verifyEvidence(@Param('custodyEventId') custodyEventId: string) {
    return this.blockchain.verifyCustodyEvidence(custodyEventId);
  }

  @Get('verify/:txHash')
  verify(@Param('txHash') txHash: string) {
    return this.blockchain.verifyTx(txHash);
  }

  @Post('anchor')
  @RequireRoles(...RolesAllowed.blockchainAnchor)
  anchor(@Body() dto: AnchorEvidenceDto) {
    return this.blockchain.anchorLive(dto);
  }

  @Post('anchor-custody/:custodyEventId')
  @RequireRoles(...RolesAllowed.blockchainAnchor)
  retryCustody(@Param('custodyEventId') custodyEventId: string) {
    return this.blockchain.retryCustodyAnchor(custodyEventId);
  }
}
