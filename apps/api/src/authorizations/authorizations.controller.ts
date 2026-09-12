import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { AuthorizationsService } from './authorizations.service';
import { CreateAuthorizationDto } from './dto/create-authorization.dto';

@Controller('batches/:batchIdOrCode/authorizations')
export class AuthorizationsController {
  constructor(private readonly service: AuthorizationsService) {}

  @Get()
  list(@Param('batchIdOrCode') batchIdOrCode: string) {
    return this.service.list(batchIdOrCode);
  }

  @Post()
  @RequireRoles(...RolesAllowed.authorizationWrite)
  create(
    @Param('batchIdOrCode') batchIdOrCode: string,
    @Body() dto: CreateAuthorizationDto,
  ) {
    return this.service.create(batchIdOrCode, dto);
  }
}
