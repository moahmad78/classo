import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Ip,
  Headers,
} from '@nestjs/common';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import type { AuthenticatedRequest } from '../../auth/guards/tenant.guard';
import { AttendanceService } from './attendance.service';
import {
  MarkStudentAttendanceDto,
  QueryStudentAttendanceDto,
  EditStudentAttendanceDto,
  StaffSelfieCheckInDto,
  StaffSelfieCheckOutDto,
  ReviewStaffAttendanceDto,
  AdminOverrideStaffAttendanceDto,
  RecordConsentDto,
} from './attendance.dto';

@Controller('attendance')
@UseGuards(TenantGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // -------------------------------------------------------------
  // STUDENT ATTENDANCE (ATT-01..05)
  // -------------------------------------------------------------

  @Post('students')
  async markStudentAttendance(
    @Req() req: AuthenticatedRequest,
    @Body() dto: MarkStudentAttendanceDto
  ) {
    return this.attendanceService.markStudentAttendance(
      req.tenantId,
      req.user.sub,
      dto
    );
  }

  @Get('students')
  async getStudentAttendance(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryStudentAttendanceDto
  ) {
    return this.attendanceService.getStudentAttendance(req.tenantId, query);
  }

  @Put('students/:id')
  async editStudentAttendance(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: EditStudentAttendanceDto
  ) {
    return this.attendanceService.editStudentAttendance(
      req.tenantId,
      id,
      req.user.sub,
      req.user.role,
      dto
    );
  }

  // -------------------------------------------------------------
  // STAFF SELFIE ATTENDANCE (STF-02, STF-05..14)
  // -------------------------------------------------------------

  @Post('consent')
  async recordConsent(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordConsentDto,
    @Ip() ip: string,
    @Headers('user-agent') ua: string
  ) {
    return this.attendanceService.recordConsent(
      req.tenantId,
      req.user.sub,
      dto,
      ip,
      ua
    );
  }

  @Post('staff/selfie-checkin')
  async checkInStaff(
    @Req() req: AuthenticatedRequest,
    @Body() dto: StaffSelfieCheckInDto,
    @Ip() ip: string,
    @Headers('user-agent') ua: string
  ) {
    return this.attendanceService.checkInStaff(
      req.tenantId,
      req.user.sub,
      dto,
      ip,
      ua
    );
  }

  @Post('staff/selfie-checkout')
  async checkOutStaff(
    @Req() req: AuthenticatedRequest,
    @Body() dto: StaffSelfieCheckOutDto
  ) {
    return this.attendanceService.checkOutStaff(
      req.tenantId,
      req.user.sub,
      dto
    );
  }

  @Get('staff/review')
  async getStaffAttendanceForReview(
    @Req() req: AuthenticatedRequest,
    @Query('date') date: string,
    @Query('status') status?: string
  ) {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    return this.attendanceService.getStaffAttendanceForReview(
      req.tenantId,
      targetDate,
      status
    );
  }

  @Post('staff/review/:id')
  async reviewStaffAttendance(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReviewStaffAttendanceDto
  ) {
    return this.attendanceService.reviewStaffAttendance(
      req.tenantId,
      id,
      req.user.sub,
      dto
    );
  }

  @Post('staff/override')
  async adminOverrideStaffAttendance(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AdminOverrideStaffAttendanceDto
  ) {
    return this.attendanceService.adminOverrideStaffAttendance(
      req.tenantId,
      req.user.sub,
      dto
    );
  }
}
