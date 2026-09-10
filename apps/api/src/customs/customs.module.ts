import { Module } from '@nestjs/common';
import { BatchesModule } from '../batches/batches.module';
import { CustomsController } from './customs.controller';
import { CustomsService } from './customs.service';

@Module({
  imports: [BatchesModule],
  controllers: [CustomsController],
  providers: [CustomsService],
})
export class CustomsModule {}
