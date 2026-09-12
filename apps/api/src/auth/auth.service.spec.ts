import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = 'test-auth-secret';
  });

  it('fails fast when AUTH_SECRET is missing', () => {
    delete process.env.AUTH_SECRET;
    const service = new AuthService(prisma as unknown as PrismaService);
    expect(() =>
      service.signToken({
        id: 'u1',
        email: 'a@b.c',
        name: 'A',
        role: 'TRANSPORTER',
        isDemo: true,
      }),
    ).toThrow(ServiceUnavailableException);
  });

  it('rejects a tampered token', () => {
    const service = new AuthService(prisma as unknown as PrismaService);
    const token = service.signToken({
      id: 'u1',
      email: 'a@b.c',
      name: 'A',
      role: 'TRANSPORTER',
      isDemo: true,
    });
    expect(() => service.verifyToken(`${token}x`)).toThrow(
      UnauthorizedException,
    );
  });
});
