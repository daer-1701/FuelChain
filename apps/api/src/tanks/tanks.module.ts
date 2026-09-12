import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TanksController } from './tanks.controller';
import { TanksService } from './tanks.service';

@Module({
  imports: [AuthModule],
  controllers: [TanksController],
  providers: [TanksService],
  exports: [TanksService],
})
export class TanksModule {}
