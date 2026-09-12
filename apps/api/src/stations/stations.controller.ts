import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ActorRole } from '@prisma/client';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequireRoles } from '../auth/require-roles';
import { StationsService } from './stations.service';

@Controller('stations')
export class StationsController {
  constructor(private readonly stations: StationsService) {}

  @Get('public')
  publicList(@Query('city') city?: string) {
    return this.stations.listPublic(city || 'all');
  }

  /** Portal Unlock: informe de camino (gate en el cliente con Key). */
  @Get('unlock-report')
  unlockReport() {
    return this.stations.listUnlockReport();
  }

  /** ANH / auditor: red completa. Estación: solo su EESS. */
  @Get('supervision')
  @RequireRoles(
    ActorRole.ADMIN,
    ActorRole.VERIFIER,
    ActorRole.AUDITOR,
    ActorRole.STATION_STAFF,
  )
  supervision(
    @CurrentUser() user: AuthUser,
    @Query('city') city?: string,
  ) {
    if (user.role === ActorRole.STATION_STAFF) {
      if (!user.stationId) {
        throw new ForbiddenException(
          'Operador de estación sin EESS asignada',
        );
      }
      return this.stations.listSupervision(city || 'all', {
        stationId: user.stationId,
        includeFleet: false,
      });
    }
    return this.stations.listSupervision(city || 'all', {
      includeFleet: true,
    });
  }

  @Get('contracts')
  @RequireRoles(
    ActorRole.ADMIN,
    ActorRole.STATION_STAFF,
    ActorRole.TRANSPORTER,
    ActorRole.DEPOT_OPERATOR,
  )
  contracts(@CurrentUser() user: AuthUser) {
    return this.stations.listContractsForActor(user);
  }

  @Post('contracts/:id/ack')
  @RequireRoles(
    ActorRole.ADMIN,
    ActorRole.STATION_STAFF,
    ActorRole.TRANSPORTER,
    ActorRole.DEPOT_OPERATOR,
  )
  ackContract(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.stations.ackContract(id, user);
  }

  @Get()
  @RequireRoles(
    ActorRole.ADMIN,
    ActorRole.VERIFIER,
    ActorRole.AUDITOR,
    ActorRole.IMPORTER,
  )
  list() {
    return this.stations.listAll();
  }
}
