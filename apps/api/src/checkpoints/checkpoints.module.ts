import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CheckpointsController } from './checkpoints.controller';
import { CheckpointsService } from './checkpoints.service';

@Module({
  imports: [AuthModule],
  controllers: [CheckpointsController],
  providers: [CheckpointsService],
  exports: [CheckpointsService],
})
export class CheckpointsModule {}
