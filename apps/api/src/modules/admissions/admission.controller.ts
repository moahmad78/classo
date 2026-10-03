import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdmissionService } from './admission.service.js';
import { TenantAuthGuard } from '../../common/guards/tenant.guard.js';
import type { AuthenticatedRequest } from '../../common/guards/tenant.guard.js';
import { AuthService } from '../auth/auth.service.js';
import {
  CreateInquirySchema,
  UpdateInquiryStatusSchema,
  SubmitStudentApplicationSchema,
} from './admission.dto.js';

@ApiTags('Admissions & Inquiry CRM (ADM-*)')
@Controller('admissions')
export class AdmissionController {
  constructor(
    private readonly admissionService: AdmissionService,
    private readonly authService: AuthService
  ) {}

  // Public Online Admission Application (ADM-01)
  @Post('apply/:codeOrSubdomain')
  @ApiOperation({ summary: 'Public online student admission form (ADM-01)' })
  async applyPublic(
    @Param('codeOrSubdomain') codeOrSubdomain: string,
    @Body() body: unknown
  ) {
    const inst = await this.authService.resolveInstitute(codeOrSubdomain);
    const parse = SubmitStudentApplicationSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.admissionService.submitApplication(inst.id, parse.data);
  }

  // Authenticated CRM Endpoints
  @ApiBearerAuth()
  @UseGuards(TenantAuthGuard)
  @Post('inquiries')
  @ApiOperation({ summary: 'Create new lead/inquiry (ADM-02)' })
  async createInquiry(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parse = CreateInquirySchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.admissionService.createInquiry(req.instituteId!, parse.data);
  }

  @ApiBearerAuth()
  @UseGuards(TenantAuthGuard)
  @Get('inquiries')
  @ApiOperation({ summary: 'List CRM inquiries by status (ADM-02)' })
  async listInquiries(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.admissionService.listInquiries(req.instituteId!, status);
  }

  @ApiBearerAuth()
  @UseGuards(TenantAuthGuard)
  @Patch('inquiries/:id/status')
  @ApiOperation({ summary: 'Update inquiry status (ADM-02)' })
  async updateInquiryStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    const parse = UpdateInquiryStatusSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.admissionService.updateInquiryStatus(req.instituteId!, id, parse.data);
  }

  @ApiBearerAuth()
  @UseGuards(TenantAuthGuard)
  @Get('applications')
  @ApiOperation({ summary: 'List submitted admission applications (ADM-03)' })
  async listApplications(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.admissionService.listApplications(req.instituteId!, status);
  }

  @ApiBearerAuth()
  @UseGuards(TenantAuthGuard)
  @Post('applications/:id/approve')
  @ApiOperation({ summary: 'Approve application and auto-create student account (ADM-03)' })
  async approveApplication(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.admissionService.approveApplication(req.instituteId!, id, req.user?.sub);
  }
}
