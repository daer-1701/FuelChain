import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CustodyQrModule } from '../custody-qr/custody-qr.module';
import { DemoController } from './demo.controller';

@Module({
  imports: [AuthModule, CustodyQrModule],
  controllers: [DemoController],
})
export class DemoModule {}
