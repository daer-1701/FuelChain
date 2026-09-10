import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const database = await this.prisma.isHealthy();
    return {
      status: database ? 'ok' : 'degraded',
      service: 'fuelchain-api',
      database: database ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };
  }
}
