import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentsService } from './documents.service';

@Controller('batches/:batchIdOrCode/documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  list(@Param('batchIdOrCode') batchIdOrCode: string) {
    return this.service.list(batchIdOrCode);
  }

  @Post()
  create(
    @Param('batchIdOrCode') batchIdOrCode: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.service.create(batchIdOrCode, dto);
  }

  @Post(':documentId/verify')
  verify(
    @Param('batchIdOrCode') batchIdOrCode: string,
    @Param('documentId') documentId: string,
    @Body() body: { sha256Hash: string },
  ) {
    return this.service.verify(batchIdOrCode, documentId, body.sha256Hash);
  }
}
