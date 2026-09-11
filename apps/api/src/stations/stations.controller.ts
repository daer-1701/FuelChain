import { Controller, Get, Query } from '@nestjs/common';
import { StationsService } from './stations.service';

@Controller('stations')
export class StationsController {
  constructor(private readonly stations: StationsService) {}

  @Get('public')
  publicList(@Query('city') city?: string) {
    return this.stations.listPublic(city || 'Cochabamba');
  }

  @Get()
  list() {
    return this.stations.listAll();
  }
}
