import { Module } from '@nestjs/common';
import { AnomaliesController } from './anomalies.controller';
import { AnomaliesService } from './anomalies.service';

@Module({
  controllers: [AnomaliesController],
  providers: [AnomaliesService],
  exports: [AnomaliesService],
})
export class AnomaliesModule {}
