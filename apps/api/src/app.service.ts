import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      name: 'FuelChain Bolivia API',
      tagline: 'Cantidad y calidad en cada tramo del camino.',
      phase: 6,
      endpoints: {
        health: '/health',
        dashboard: '/dashboard/kpis',
        batches: '/batches',
        passport: '/batches/:idOrCode/passport',
        custody: '/batches/:idOrCode/custody',
        authorizations: '/batches/:idOrCode/authorizations',
        transports: '/batches/:idOrCode/transports',
        customs: '/batches/:idOrCode/customs',
        documents: '/batches/:idOrCode/documents',
        quality: '/batches/:idOrCode/quality',
        vehicles: '/vehicles',
        tanks: '/tanks',
        measurements: '/measurements',
        anomalies: '/anomalies',
        audits: '/audits',
        blockchain: '/blockchain/anchors',
        blockchainStatus: '/blockchain/status',
        blockchainAnchor: 'POST /blockchain/anchor',
        blockchainVerify: '/blockchain/verify/:txHash',
      },
    };
  }
}
