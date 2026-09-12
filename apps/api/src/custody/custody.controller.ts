import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { CustodyService } from './custody.service';
import { CreateCustodyEventDto } from './dto/create-custody-event.dto';

@Controller('batches/:batchIdOrCode/custody')
export class CustodyController {
  constructor(private readonly custodyService: CustodyService) {}

  @Get()
  list(@Param('batchIdOrCode') batchIdOrCode: string) {
    return this.custodyService.list(batchIdOrCode);
  }

  @Post()
  @RequireRoles(...RolesAllowed.custodyWrite)
  create(
    @Param('batchIdOrCode') batchIdOrCode: string,
    @Body() dto: CreateCustodyEventDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.custodyService.create(batchIdOrCode, dto, user);
  }
}
