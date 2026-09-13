import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadRootEnv } from './load-env';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const envPath = loadRootEnv();
  if (envPath) logger.log(`Loaded env from ${envPath}`);
  else logger.warn('No .env found — using process env only');

  const app = await NestFactory.create(AppModule);
  const corsRaw = process.env.API_CORS_ORIGIN ?? 'http://localhost:3000';
  const corsList = corsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const corsOrigin =
    corsRaw.trim() === '*'
      ? true
      : corsList.length === 0
        ? 'http://localhost:3000'
        : corsList.length === 1
          ? corsList[0]
          : corsList;
  app.enableCors({
    origin: corsOrigin,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  logger.log(`FuelChain API listening on http://0.0.0.0:${port}`);
}
bootstrap();
