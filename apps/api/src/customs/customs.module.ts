import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BatchesModule } from '../batches/batches.module';
import { CustomsController } from './customs.controller';
import { CustomsService } from './customs.service';

@Module({
  imports: [AuthModule, BatchesModule],
  controllers: [CustomsController],
  providers: [CustomsService],
})
export class CustomsModule {}
