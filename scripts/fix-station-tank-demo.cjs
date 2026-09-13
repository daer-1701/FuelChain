const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const before = await p.station.findUnique({
    where: { code: 'ST-CBB-01' },
    include: { tanks: true },
  });
  console.log(
    'before',
    before?.tanks?.map((t) => ({
      name: t.name,
      cap: t.capacityLiters.toString(),
      stock: t.currentStockLiters.toString(),
    })),
  );

  const updated = await p.storageTank.updateMany({
    where: { station: { code: 'ST-CBB-01' } },
    data: { currentStockLiters: 15000 },
  });
  console.log('updated', updated.count);

  const after = await p.station.findUnique({
    where: { code: 'ST-CBB-01' },
    include: { tanks: true },
  });
  console.log(
    'after',
    after?.tanks?.map((t) => ({
      name: t.name,
      cap: t.capacityLiters.toString(),
      stock: t.currentStockLiters.toString(),
    })),
  );
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
