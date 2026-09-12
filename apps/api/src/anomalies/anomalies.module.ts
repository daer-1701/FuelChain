import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AnomaliesController } from './anomalies.controller';
import { AnomaliesService } from './anomalies.service';

@Module({
  imports: [AuthModule],
  controllers: [AnomaliesController],
  providers: [AnomaliesService],
  exports: [AnomaliesService],
})
export class AnomaliesModule {}
