import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditsController } from './audits.controller';
import { AuditsService } from './audits.service';

@Module({
  imports: [AuthModule],
  controllers: [AuditsController],
  providers: [AuditsService],
})
export class AuditsModule {}
