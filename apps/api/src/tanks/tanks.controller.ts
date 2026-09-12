import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { CreateMeasurementDto, CreateTankDto } from './dto/tanks.dto';
import { TanksService } from './tanks.service';

@Controller()
export class TanksController {
  constructor(private readonly service: TanksService) {}

  @Get('tanks')
  listTanks() {
    return this.service.listTanks();
  }

  @Post('tanks')
  @RequireRoles(...RolesAllowed.tanksWrite)
  createTank(@Body() dto: CreateTankDto) {
    return this.service.createTank(dto);
  }

  @Get('measurements')
  listMeasurements(
    @Query('tankId') tankId?: string,
    @Query('batchId') batchId?: string,
  ) {
    return this.service.listMeasurements(tankId, batchId);
  }

  @Post('measurements')
  @RequireRoles(...RolesAllowed.measurementsWrite)
  createMeasurement(@Body() dto: CreateMeasurementDto) {
    return this.service.createMeasurement(dto);
  }
}
