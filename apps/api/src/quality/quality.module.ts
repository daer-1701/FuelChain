import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BatchesModule } from '../batches/batches.module';
import { QualityController } from './quality.controller';
import { QualityService } from './quality.service';

@Module({
  imports: [AuthModule, BatchesModule],
  controllers: [QualityController],
  providers: [QualityService],
})
export class QualityModule {}
