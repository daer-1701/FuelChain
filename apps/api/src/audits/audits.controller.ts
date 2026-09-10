import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
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
  create(@Body() dto: CreateAuditCaseDto) {
    return this.service.create(dto);
  }

  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() dto: AddAuditNoteDto) {
    return this.service.addNote(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAuditStatusDto) {
    return this.service.updateStatus(id, dto);
  }
}
