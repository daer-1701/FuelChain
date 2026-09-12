import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StationsController } from './stations.controller';
import { StationsService } from './stations.service';

@Module({
  imports: [AuthModule],
  controllers: [StationsController],
  providers: [StationsService],
  exports: [StationsService],
})
export class StationsModule {}
