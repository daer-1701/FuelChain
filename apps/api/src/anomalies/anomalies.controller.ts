import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
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
  create(@Body() dto: CreateAnomalyDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAnomalyStatusDto) {
    return this.service.updateStatus(id, dto);
  }
}
