import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BatchesModule } from '../batches/batches.module';
import { TransportsController } from './transports.controller';
import { TransportsService } from './transports.service';

@Module({
  imports: [AuthModule, BatchesModule],
  controllers: [TransportsController],
  providers: [TransportsService],
})
export class TransportsModule {}
