import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  CreateLabAnalysisDto,
  CreateQualityCertificateDto,
  CreateSamplingDto,
} from './dto/quality.dto';
import { QualityService } from './quality.service';

@Controller('batches/:batchIdOrCode/quality')
export class QualityController {
  constructor(private readonly service: QualityService) {}

  @Get()
  summary(@Param('batchIdOrCode') batchIdOrCode: string) {
    return this.service.summary(batchIdOrCode);
  }

  @Post('certificates')
  addCertificate(
    @Param('batchIdOrCode') batchIdOrCode: string,
    @Body() dto: CreateQualityCertificateDto,
  ) {
    return this.service.addCertificate(batchIdOrCode, dto);
  }

  @Post('sampling')
  addSampling(
    @Param('batchIdOrCode') batchIdOrCode: string,
    @Body() dto: CreateSamplingDto,
  ) {
    return this.service.addSampling(batchIdOrCode, dto);
  }

  @Post('lab-analyses')
  addLabAnalysis(
    @Param('batchIdOrCode') batchIdOrCode: string,
    @Body() dto: CreateLabAnalysisDto,
  ) {
    return this.service.addLabAnalysis(batchIdOrCode, dto);
  }
}
