import { Module } from '@nestjs/common';
import { BatchesModule } from '../batches/batches.module';
import { TransportsController } from './transports.controller';
import { TransportsService } from './transports.service';

@Module({
  imports: [BatchesModule],
  controllers: [TransportsController],
  providers: [TransportsService],
})
export class TransportsModule {}
