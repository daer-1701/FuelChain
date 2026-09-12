import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BatchesModule } from '../batches/batches.module';
import { AuthorizationsController } from './authorizations.controller';
import { AuthorizationsService } from './authorizations.service';

@Module({
  imports: [AuthModule, BatchesModule],
  controllers: [AuthorizationsController],
  providers: [AuthorizationsService],
})
export class AuthorizationsModule {}
