import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CustodyModule } from '../custody/custody.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CisternsController } from './cisterns.controller';
import { CisternsService } from './cisterns.service';

@Module({
  imports: [PrismaModule, AuthModule, CustodyModule],
  controllers: [CisternsController],
  providers: [CisternsService],
  exports: [CisternsService],
})
export class CisternsModule {}
