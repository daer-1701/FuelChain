import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { BlockchainService } from './blockchain.service';
import { AnchorEvidenceDto } from './dto/anchor-evidence.dto';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchain: BlockchainService) {}

  @Get('anchors')
  list(@Query('batchId') batchId?: string) {
    return this.blockchain.listAnchors(batchId);
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
