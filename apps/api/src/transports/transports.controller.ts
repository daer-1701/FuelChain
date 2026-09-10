import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateTransportDto } from './dto/create-transport.dto';
import { TransportsService } from './transports.service';

@Controller('batches/:batchIdOrCode/transports')
export class TransportsController {
  constructor(private readonly service: TransportsService) {}

  @Get()
  list(@Param('batchIdOrCode') batchIdOrCode: string) {
    return this.service.list(batchIdOrCode);
  }

  @Post()
  create(
    @Param('batchIdOrCode') batchIdOrCode: string,
    @Body() dto: CreateTransportDto,
  ) {
    return this.service.create(batchIdOrCode, dto);
  }
}
