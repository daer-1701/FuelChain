import { Body, Controller, Get, Post } from '@nestjs/common';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  @RequireRoles(...RolesAllowed.vehiclesWrite)
  create(@Body() dto: CreateVehicleDto) {
    return this.service.create(dto);
  }
}
