import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { AuditsService } from './audits.service';
import {
  AddAuditNoteDto,
  CreateAuditCaseDto,
  UpdateAuditStatusDto,
} from './dto/audit.dto';

@Controller('audits')
export class AuditsController {
  constructor(private readonly service: AuditsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequireRoles(...RolesAllowed.auditWrite)
  create(@Body() dto: CreateAuditCaseDto) {
    return this.service.create(dto);
  }

  @Post(':id/notes')
  @RequireRoles(...RolesAllowed.auditWrite)
  addNote(@Param('id') id: string, @Body() dto: AddAuditNoteDto) {
    return this.service.addNote(id, dto);
  }

  @Patch(':id/status')
  @RequireRoles(...RolesAllowed.auditWrite)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAuditStatusDto) {
    return this.service.updateStatus(id, dto);
  }
}
