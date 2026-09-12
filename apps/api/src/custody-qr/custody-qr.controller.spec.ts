import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ActorRole } from '@prisma/client';
import request from 'supertest';
import { AuthService, type AuthUser } from '../auth/auth.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CustodyQrController } from './custody-qr.controller';
import { CustodyQrService } from './custody-qr.service';

const transporter: AuthUser = {
  id: 'u-t',
  email: 'chofer@fuelchain.bo',
  name: 'Chofer',
  role: ActorRole.TRANSPORTER,
  isDemo: true,
};

const verifier: AuthUser = {
  id: 'u-v',
  email: 'anh@fuelchain.bo',
  name: 'ANH',
  role: ActorRole.VERIFIER,
  isDemo: true,
};

const station: AuthUser = {
  id: 'u-s',
  email: 'estacion@fuelchain.bo',
  name: 'Estación',
  role: ActorRole.STATION_STAFF,
  isDemo: true,
};

describe('CustodyQrController authz', () => {
  let app: INestApplication;
  const custodyQr = {
    issue: jest.fn().mockResolvedValue({ data: { tokenId: 'BT-1' } }),
    accept: jest.fn().mockResolvedValue({ data: { status: 'CONSUMED' } }),
    getBaton: jest.fn().mockResolvedValue({ data: { tokenId: 'BT-1', status: 'ACTIVE' } }),
    syncOffline: jest.fn().mockResolvedValue({ results: [] }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const auth = {
      resolveUser: jest.fn(async (token?: string) => {
        if (!token) throw new UnauthorizedException('Login requerido');
        if (token === 'transporter') return transporter;
        if (token === 'verifier') return verifier;
        if (token === 'station') return station;
        throw new UnauthorizedException('Token inválido');
      }),
    };

    const module = await Test.createTestingModule({
      controllers: [CustodyQrController],
      providers: [
        { provide: CustodyQrService, useValue: custodyQr },
        { provide: AuthService, useValue: auth },
        AuthGuard,
        RolesGuard,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects issue without a token', async () => {
    await request(app.getHttpServer())
      .post('/custody-qr/issue')
      .send({
        batchCode: 'FC-BO-2026-000182',
        eventType: 'IN_TRANSIT',
        volumeLiters: 1000,
      })
      .expect(401);
  });

  it('rejects issue with an unauthorized role', async () => {
    await request(app.getHttpServer())
      .post('/custody-qr/issue')
      .set('Authorization', 'Bearer verifier')
      .send({
        batchCode: 'FC-BO-2026-000182',
        eventType: 'IN_TRANSIT',
        volumeLiters: 1000,
        issuedByRole: 'TRANSPORTER',
      })
      .expect(403);
    expect(custodyQr.issue).not.toHaveBeenCalled();
  });

  it('allows issue for TRANSPORTER and ignores body role', async () => {
    await request(app.getHttpServer())
      .post('/custody-qr/issue')
      .set('Authorization', 'Bearer transporter')
      .send({
        batchCode: 'FC-BO-2026-000182',
        eventType: 'IN_TRANSIT',
        volumeLiters: 1000,
        stationCode: 'ST-CBB-01',
        issuedByRole: 'ADMIN',
      })
      .expect(201);
    expect(custodyQr.issue).toHaveBeenCalledWith(
      expect.not.objectContaining({ issuedByRole: 'ADMIN' }),
      transporter,
    );
  });

  it('rejects accept when the session role cannot receive', async () => {
    await request(app.getHttpServer())
      .post('/custody-qr/accept')
      .set('Authorization', 'Bearer transporter')
      .send({ tokenId: 'BT-1', consumedByRole: 'STATION_STAFF' })
      .expect(403);
    expect(custodyQr.accept).not.toHaveBeenCalled();
  });

  it('allows accept for STATION_STAFF without trusting consumedByRole', async () => {
    await request(app.getHttpServer())
      .post('/custody-qr/accept')
      .set('Authorization', 'Bearer station')
      .send({ tokenId: 'BT-1', consumedByRole: 'ADMIN' })
      .expect(201);
    expect(custodyQr.accept).toHaveBeenCalledWith(
      expect.objectContaining({ tokenId: 'BT-1' }),
      station,
    );
    expect(custodyQr.accept.mock.calls[0][0].consumedByRole).toBeUndefined();
  });

  it('keeps public GET of a baton unauthenticated', async () => {
    await request(app.getHttpServer()).get('/custody-qr/BT-1').expect(200);
  });
});
