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
import { StaffService } from './staff.service.js';
import { TenantAuthGuard } from '../../common/guards/tenant.guard.js';
import type { AuthenticatedRequest } from '../../common/guards/tenant.guard.js';
import {
  InviteTeacherSchema,
  AssignTeachingSchema,
  CreateLeaveTypeSchema,
  SubmitLeaveRequestSchema,
  ReviewLeaveRequestSchema,
} from './staff.dto.js';

@ApiTags('Staff Management & Onboarding (STF-*)')
@ApiBearerAuth()
@UseGuards(TenantAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post('invite')
  @ApiOperation({ summary: 'Invite teacher/faculty by Principal (STF-15)' })
  async inviteTeacher(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parse = InviteTeacherSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.staffService.inviteTeacher(req.instituteId!, parse.data, req.user?.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List staff profiles (STF-01)' })
  async listStaff(@Req() req: AuthenticatedRequest, @Query('departmentId') departmentId?: string) {
    return this.staffService.listStaff(req.instituteId!, departmentId);
  }

  @Post('assignments')
  @ApiOperation({ summary: 'Assign teacher to subject & class/section/batch (STF-04)' })
  async assignTeaching(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parse = AssignTeachingSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.staffService.assignTeaching(req.instituteId!, parse.data);
  }

  @Get('assignments')
  @ApiOperation({ summary: 'List teaching assignments (STF-04)' })
  async listAssignments(@Req() req: AuthenticatedRequest, @Query('staffId') staffId?: string) {
    return this.staffService.listTeachingAssignments(req.instituteId!, staffId);
  }

  @Post('leave/types')
  @ApiOperation({ summary: 'Create leave type (STF-03)' })
  async createLeaveType(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parse = CreateLeaveTypeSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.staffService.createLeaveType(req.instituteId!, parse.data);
  }

  @Get('leave/types')
  @ApiOperation({ summary: 'List leave types (STF-03)' })
  async listLeaveTypes(@Req() req: AuthenticatedRequest) {
    return this.staffService.listLeaveTypes(req.instituteId!);
  }

  @Post('leave/requests')
  @ApiOperation({ summary: 'Submit staff leave request (STF-03)' })
  async submitLeave(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parse = SubmitLeaveRequestSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.staffService.submitLeaveRequest(req.instituteId!, req.user?.sub!, parse.data);
  }

  @Patch('leave/requests/:id/review')
  @ApiOperation({ summary: 'Approve or reject staff leave request (STF-03)' })
  async reviewLeave(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    const parse = ReviewLeaveRequestSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.staffService.reviewLeaveRequest(req.instituteId!, id, parse.data, req.user?.sub);
  }
}
