import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
  createMeasurement(@Body() dto: CreateMeasurementDto) {
    return this.service.createMeasurement(dto);
  }
}
