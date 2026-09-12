import { Body, Controller, Get, Post } from '@nestjs/common';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.service';
import { CheckpointsService } from './checkpoints.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';

@Controller('checkpoints')
export class CheckpointsController {
  constructor(private readonly checkpoints: CheckpointsService) {}

  @Get()
  @RequireRoles(...RolesAllowed.checkpointRead)
  list(@CurrentUser() user: AuthUser) {
    return this.checkpoints.listForActor(user);
  }

  @Post()
  @RequireRoles(...RolesAllowed.checkpointWrite)
  create(
    @Body() dto: CreateCheckpointDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.checkpoints.create(dto, user);
  }
}
