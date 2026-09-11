import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ActorRole } from '@prisma/client';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: ActorRole;
  isDemo: boolean;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private secret() {
    return (
      process.env.AUTH_SECRET ||
      process.env.BATON_HMAC_SECRET ||
      'fuelchain-demo-auth-secret'
    );
  }

  /** DEMO password hashing (scrypt). Not for production identity providers. */
  hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
    const hash = scryptSync(password, salt, 32).toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password: string, stored: string) {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const next = scryptSync(password, salt, 32);
    const prev = Buffer.from(hash, 'hex');
    if (prev.length !== next.length) return false;
    return timingSafeEqual(prev, next);
  }

  signToken(user: AuthUser, ttlSec = 60 * 60 * 12) {
    const exp = Math.floor(Date.now() / 1000) + ttlSec;
    const body = Buffer.from(
      JSON.stringify({ sub: user.id, role: user.role, exp }),
      'utf8',
    ).toString('base64url');
    const sig = createHmac('sha256', this.secret())
      .update(body)
      .digest('base64url');
    return `${body}.${sig}`;
  }

  verifyToken(token: string): { sub: string; role: string; exp: number } {
    const [body, sig] = token.split('.');
    if (!body || !sig) throw new UnauthorizedException('Token inválido');
    const expected = createHmac('sha256', this.secret())
      .update(body)
      .digest('base64url');
    if (sig !== expected) throw new UnauthorizedException('Firma inválida');
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as { sub: string; role: string; exp: number };
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Sesión expirada');
    }
    return payload;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isDemo: user.isDemo,
    };
    return serialize({
      label: 'DEMO',
      note: 'Login DEMO con scrypt local. No es IdP productivo.',
      data: {
        token: this.signToken(authUser),
        user: authUser,
      },
    });
  }

  async me(token?: string) {
    if (!token) throw new UnauthorizedException('Sin sesión');
    const payload = this.verifyToken(token);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return serialize({
      label: 'DEMO',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isDemo: user.isDemo,
      },
    });
  }

  async listDemoAccounts() {
    const users = await this.prisma.user.findMany({
      where: { isDemo: true, passwordHash: { not: null } },
      orderBy: { role: 'asc' },
      select: { email: true, name: true, role: true },
    });
    return {
      label: 'DEMO',
      passwordHint: 'demo123',
      data: users,
    };
  }

  requireRole(token: string | undefined, roles?: ActorRole[]) {
    if (!token) throw new UnauthorizedException('Login requerido');
    const payload = this.verifyToken(token);
    if (roles && !roles.includes(payload.role as ActorRole)) {
      throw new BadRequestException(`Rol ${payload.role} no autorizado`);
    }
    return payload;
  }
}
