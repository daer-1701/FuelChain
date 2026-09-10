import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BatchesService } from './batches.service';
import {
  CreateBatchDto,
  ListBatchesQueryDto,
  UpdateBatchDto,
} from './dto/batch.dto';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  create(@Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListBatchesQueryDto) {
    return this.batchesService.findAll(query);
  }

  @Get(':idOrCode/passport')
  getPassport(@Param('idOrCode') idOrCode: string) {
    return this.batchesService.getPassport(idOrCode);
  }

  @Get(':idOrCode')
  findOne(@Param('idOrCode') idOrCode: string) {
    return this.batchesService.findOne(idOrCode);
  }

  @Patch(':idOrCode')
  update(@Param('idOrCode') idOrCode: string, @Body() dto: UpdateBatchDto) {
    return this.batchesService.update(idOrCode, dto);
  }

  @Delete(':idOrCode')
  remove(@Param('idOrCode') idOrCode: string) {
    return this.batchesService.remove(idOrCode);
  }
}
