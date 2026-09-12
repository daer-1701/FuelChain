import { applyDecorators, UseGuards } from '@nestjs/common';
import { ActorRole } from '@prisma/client';
import { AuthGuard } from './auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

export function RequireRoles(...roles: ActorRole[]) {
  return applyDecorators(UseGuards(AuthGuard, RolesGuard), Roles(...roles));
}
