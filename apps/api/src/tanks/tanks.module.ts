import { Module } from '@nestjs/common';
import { TanksController } from './tanks.controller';
import { TanksService } from './tanks.service';

@Module({
  controllers: [TanksController],
  providers: [TanksService],
  exports: [TanksService],
})
export class TanksModule {}
