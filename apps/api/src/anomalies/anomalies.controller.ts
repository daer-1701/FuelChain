import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { AnomaliesService } from './anomalies.service';
import {
  CreateAnomalyDto,
  ListAnomaliesQueryDto,
  UpdateAnomalyStatusDto,
} from './dto/anomaly.dto';

@Controller('anomalies')
export class AnomaliesController {
  constructor(private readonly service: AnomaliesService) {}

  @Get()
  findAll(@Query() query: ListAnomaliesQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequireRoles(...RolesAllowed.anomalyCreate)
  create(@Body() dto: CreateAnomalyDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  @RequireRoles(...RolesAllowed.anomalyStatus)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAnomalyStatusDto) {
    return this.service.updateStatus(id, dto);
  }
}
