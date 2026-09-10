import { PrismaService } from '../prisma/prisma.service';

const PREFIX = 'FC-BO';

/**
 * Generates FC-BO-YYYY-###### using year + sequential count (DEMO / FUELCHAIN ABSTRACTION).
 */
export async function generateBatchCode(prisma: PrismaService, year = new Date().getUTCFullYear()): Promise<string> {
  const prefix = `${PREFIX}-${year}-`;
  const count = await prisma.fuelBatch.count({
    where: { batchCode: { startsWith: prefix } },
  });
  const seq = String(count + 1).padStart(6, '0');
  return `${prefix}${seq}`;
}
