import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CustodyModule } from '../custody/custody.module';
import { CustodyQrController } from './custody-qr.controller';
import { CustodyQrService } from './custody-qr.service';

@Module({
  imports: [AuthModule, CustodyModule],
  controllers: [CustodyQrController],
  providers: [CustodyQrService],
  exports: [CustodyQrService],
})
export class CustodyQrModule {}
