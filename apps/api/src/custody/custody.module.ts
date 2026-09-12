import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BatchesModule } from '../batches/batches.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { CustodyController } from './custody.controller';
import { CustodyService } from './custody.service';
import { ReceivedFollowUpService } from './received-follow-up.service';

@Module({
  imports: [AuthModule, BatchesModule, BlockchainModule],
  controllers: [CustodyController],
  providers: [CustodyService, ReceivedFollowUpService],
  exports: [CustodyService, ReceivedFollowUpService],
})
export class CustodyModule {}
