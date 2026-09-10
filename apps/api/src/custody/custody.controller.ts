import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustodyService } from './custody.service';
import { CreateCustodyEventDto } from './dto/create-custody-event.dto';

@Controller('batches/:batchIdOrCode/custody')
export class CustodyController {
  constructor(private readonly custodyService: CustodyService) {}

  @Get()
  list(@Param('batchIdOrCode') batchIdOrCode: string) {
    return this.custodyService.list(batchIdOrCode);
  }

  @Post()
  create(
    @Param('batchIdOrCode') batchIdOrCode: string,
    @Body() dto: CreateCustodyEventDto,
  ) {
    return this.custodyService.create(batchIdOrCode, dto);
  }
}
