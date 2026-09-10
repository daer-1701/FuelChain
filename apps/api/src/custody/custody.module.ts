import { Module } from '@nestjs/common';
import { BatchesModule } from '../batches/batches.module';
import { CustodyController } from './custody.controller';
import { CustodyService } from './custody.service';

@Module({
  imports: [BatchesModule],
  controllers: [CustodyController],
  providers: [CustodyService],
  exports: [CustodyService],
})
export class CustodyModule {}
