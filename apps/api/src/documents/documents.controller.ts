import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RolesAllowed } from '../auth/permissions';
import { RequireRoles } from '../auth/require-roles';
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
  @RequireRoles(...RolesAllowed.documentsWrite)
  create(
    @Param('batchIdOrCode') batchIdOrCode: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.service.create(batchIdOrCode, dto);
  }

  @Post(':documentId/verify')
  @RequireRoles(...RolesAllowed.documentsWrite)
  verify(
    @Param('batchIdOrCode') batchIdOrCode: string,
    @Param('documentId') documentId: string,
    @Body() body: { sha256Hash: string },
  ) {
    return this.service.verify(batchIdOrCode, documentId, body.sha256Hash);
  }
}
