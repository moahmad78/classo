import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import type { AuthenticatedRequest } from '../../auth/guards/tenant.guard';
import { FeesService } from './fees.service';
import {
  CreateFeeHeadDto,
  CreateFeeStructureDto,
  AssignStudentFeePlanDto,
  CollectPaymentDto,
  RazorpayWebhookDto,
  SendReminderNowDto,
} from './fees.dto';

@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // -------------------------------------------------------------
  // FEE HEADS & STRUCTURES (FEE-01)
  // -------------------------------------------------------------

  @Post('heads')
  @UseGuards(TenantGuard)
  async createFeeHead(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFeeHeadDto
  ) {
    return this.feesService.createFeeHead(req.tenantId, dto);
  }

  @Get('heads')
  @UseGuards(TenantGuard)
  async getFeeHeads(@Req() req: AuthenticatedRequest) {
    return this.feesService.getFeeHeads(req.tenantId);
  }

  @Post('structures')
  @UseGuards(TenantGuard)
  async createFeeStructure(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFeeStructureDto
  ) {
    return this.feesService.createFeeStructure(req.tenantId, req.user.sub, dto);
  }

  @Get('structures')
  @UseGuards(TenantGuard)
  async getFeeStructures(
    @Req() req: AuthenticatedRequest,
    @Query('classId') classId?: string
  ) {
    return this.feesService.getFeeStructures(req.tenantId, classId);
  }

  // -------------------------------------------------------------
  // STUDENT FEE PLANS & DUES (FEE-02, FEE-03)
  // -------------------------------------------------------------

  @Post('plans')
  @UseGuards(TenantGuard)
  async assignStudentFeePlan(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AssignStudentFeePlanDto
  ) {
    return this.feesService.assignStudentFeePlan(
      req.tenantId,
      req.user.sub,
      dto
    );
  }

  // -------------------------------------------------------------
  // PAYMENT COLLECTION & RECEIPTS (FEE-04, FEE-05)
  // -------------------------------------------------------------

  @Post('payments')
  @UseGuards(TenantGuard)
  async collectPayment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CollectPaymentDto
  ) {
    return this.feesService.collectPayment(
      req.tenantId,
      req.user.sub,
      dto
    );
  }

  @Post('receipts/:id/reprint')
  @UseGuards(TenantGuard)
  async reprintReceipt(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.feesService.reprintReceipt(req.tenantId, id, req.user.sub);
  }

  // -------------------------------------------------------------
  // DASHBOARDS & LEDGERS (FEE-08, FEE-09, FEE-10)
  // -------------------------------------------------------------

  @Get('dashboard')
  @UseGuards(TenantGuard)
  async getFeeDashboard(@Req() req: AuthenticatedRequest) {
    return this.feesService.getFeeDashboard(req.tenantId);
  }

  @Get('ledger/:studentId')
  @UseGuards(TenantGuard)
  async getStudentLedger(
    @Req() req: AuthenticatedRequest,
    @Param('studentId') studentId: string
  ) {
    return this.feesService.getStudentLedger(req.tenantId, studentId);
  }

  @Get('reports/day-end')
  @UseGuards(TenantGuard)
  async getDayEndReport(
    @Req() req: AuthenticatedRequest,
    @Query('date') date?: string
  ) {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    return this.feesService.getDayEndReport(req.tenantId, targetDate);
  }

  // -------------------------------------------------------------
  // REMINDERS (REM-01..08, CTL-09)
  // -------------------------------------------------------------

  @Post('reminders/send-now')
  @UseGuards(TenantGuard)
  async sendReminderNow(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SendReminderNowDto
  ) {
    return this.feesService.sendReminder(
      req.tenantId,
      dto.studentDueId,
      dto.channel || 'whatsapp'
    );
  }

  // -------------------------------------------------------------
  // RAZORPAY WEBHOOK (FEE-06 - Public webhook with signature)
  // -------------------------------------------------------------

  @Post('webhook/razorpay')
  async handleRazorpayWebhook(
    @Body() webhook: RazorpayWebhookDto,
    @Headers('x-razorpay-signature') signature?: string
  ) {
    return this.feesService.processRazorpayWebhook(webhook, signature);
  }
}
