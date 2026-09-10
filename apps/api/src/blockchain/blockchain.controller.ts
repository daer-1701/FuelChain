import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

  @Get('verify/:txHash')
  verify(@Param('txHash') txHash: string) {
    return this.blockchain.verifyTx(txHash);
  }

  @Post('anchor')
  anchor(@Body() dto: AnchorEvidenceDto) {
    return this.blockchain.anchorLive(dto);
  }
}
