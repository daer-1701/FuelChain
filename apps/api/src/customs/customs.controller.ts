import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustomsService } from './customs.service';
import { CreateCustomsEventDto } from './dto/create-customs-event.dto';

@Controller('batches/:batchIdOrCode/customs')
export class CustomsController {
  constructor(private readonly service: CustomsService) {}

  @Get()
  list(@Param('batchIdOrCode') batchIdOrCode: string) {
    return this.service.list(batchIdOrCode);
  }

  @Post()
  create(
    @Param('batchIdOrCode') batchIdOrCode: string,
    @Body() dto: CreateCustomsEventDto,
  ) {
    return this.service.create(batchIdOrCode, dto);
  }
}
