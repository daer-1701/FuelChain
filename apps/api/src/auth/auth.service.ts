import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
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
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException('AUTH_SECRET is required');
    }
    return secret;
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
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      throw new UnauthorizedException('Firma inválida');
    }
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

  async resolveUser(token?: string): Promise<AuthUser> {
    if (!token) throw new UnauthorizedException('Sin sesión');
    const payload = this.verifyToken(token);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isDemo: user.isDemo,
    };
  }

  async me(token?: string) {
    const user = await this.resolveUser(token);
    return serialize({
      label: 'DEMO',
      data: user,
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

  async requireRole(token: string | undefined, roles?: ActorRole[]) {
    const user = await this.resolveUser(token);
    if (roles && !roles.includes(user.role)) {
      throw new ForbiddenException(`Rol ${user.role} no autorizado`);
    }
    return user;
  }
}
