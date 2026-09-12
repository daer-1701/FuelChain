import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ActorRole } from '@prisma/client';
import type { AuthUser } from './auth.service';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<ActorRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!req.user) {
      throw new UnauthorizedException('Login requerido');
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenException(`Rol ${req.user.role} no autorizado`);
    }
    return true;
  }
}
