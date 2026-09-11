import { Module } from '@nestjs/common';
import { CustodyQrController } from './custody-qr.controller';
import { CustodyQrService } from './custody-qr.service';

@Module({
  controllers: [CustodyQrController],
  providers: [CustodyQrService],
  exports: [CustodyQrService],
})
export class CustodyQrModule {}
