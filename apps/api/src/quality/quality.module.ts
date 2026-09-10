import { Module } from '@nestjs/common';
import { BatchesModule } from '../batches/batches.module';
import { QualityController } from './quality.controller';
import { QualityService } from './quality.service';

@Module({
  imports: [BatchesModule],
  controllers: [QualityController],
  providers: [QualityService],
})
export class QualityModule {}
