import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AnomaliesModule } from './anomalies/anomalies.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditsModule } from './audits/audits.module';
import { AuthorizationsModule } from './authorizations/authorizations.module';
import { BatchesModule } from './batches/batches.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { CheckpointsModule } from './checkpoints/checkpoints.module';
import { CustodyModule } from './custody/custody.module';
import { CustodyQrModule } from './custody-qr/custody-qr.module';
import { CustomsModule } from './customs/customs.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { DemoModule } from './demo/demo.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { QualityModule } from './quality/quality.module';
import { SettlementsModule } from './settlements/settlements.module';
import { StationsModule } from './stations/stations.module';
import { TanksModule } from './tanks/tanks.module';
import { TransportsModule } from './transports/transports.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '..', '..', '..', '.env'),
        join(process.cwd(), '.env'),
        join(process.cwd(), '..', '..', '.env'),
      ],
    }),
    PrismaModule,
    AuthModule,
    DemoModule,
    DashboardModule,
    BatchesModule,
    CustodyModule,
    CustodyQrModule,
    StationsModule,
    AuthorizationsModule,
    TransportsModule,
    VehiclesModule,
    CustomsModule,
    DocumentsModule,
    QualityModule,
    TanksModule,
    AnomaliesModule,
    AuditsModule,
    BlockchainModule,
    CheckpointsModule,
    SettlementsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
