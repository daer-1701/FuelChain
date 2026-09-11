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
  app.enableCors({
    origin: process.env.API_CORS_ORIGIN ?? 'http://localhost:3000',
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
  await app.listen(port);
  logger.log(`FuelChain API listening on http://localhost:${port}`);
}
bootstrap();
