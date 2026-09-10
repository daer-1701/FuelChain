import { Module } from '@nestjs/common';
import { BatchesModule } from '../batches/batches.module';
import { AuthorizationsController } from './authorizations.controller';
import { AuthorizationsService } from './authorizations.service';

@Module({
  imports: [BatchesModule],
  controllers: [AuthorizationsController],
  providers: [AuthorizationsService],
})
export class AuthorizationsModule {}
