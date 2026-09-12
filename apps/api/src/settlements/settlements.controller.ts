import { Controller, Get, Param, Post } from '@nestjs/common';
import { ActorRole } from '@prisma/client';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequireRoles } from '../auth/require-roles';
import { SettlementsService } from './settlements.service';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlements: SettlementsService) {}

  @Get()
  @RequireRoles(
    ActorRole.ADMIN,
    ActorRole.STATION_STAFF,
    ActorRole.TRANSPORTER,
    ActorRole.VERIFIER,
    ActorRole.DEPOT_OPERATOR,
  )
  list(@CurrentUser() user: AuthUser) {
    return this.settlements.listForActor(user);
  }

  @Post(':id/pay')
  @RequireRoles(ActorRole.ADMIN, ActorRole.STATION_STAFF)
  pay(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.settlements.markPaid(id, user);
  }
}
