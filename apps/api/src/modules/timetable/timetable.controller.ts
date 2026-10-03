import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import type { AuthenticatedRequest } from '../../auth/guards/tenant.guard';
import { TimetableService } from './timetable.service';
import {
  CreateTimetableDto,
  CreateTimetableSlotDto,
  CreateSubstitutionDto,
} from './timetable.dto';

@Controller('timetables')
@UseGuards(TenantGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  async createTimetable(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTimetableDto
  ) {
    return this.timetableService.createTimetable(req.tenantId, req.user.sub, dto);
  }

  @Get()
  async getTimetables(
    @Req() req: AuthenticatedRequest,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string
  ) {
    return this.timetableService.getTimetables(req.tenantId, classId, sectionId);
  }

  @Get('my-schedule')
  async getMySchedule(@Req() req: AuthenticatedRequest) {
    return this.timetableService.getTeacherSchedule(req.tenantId, req.user.sub);
  }

  @Get(':id')
  async getTimetableDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.timetableService.getTimetableDetails(req.tenantId, id);
  }

  @Post(':id/slots')
  async addSlot(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateTimetableSlotDto
  ) {
    return this.timetableService.addSlot(req.tenantId, id, dto);
  }

  @Post('substitutions')
  async assignSubstitution(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSubstitutionDto
  ) {
    return this.timetableService.assignSubstitution(
      req.tenantId,
      req.user.sub,
      dto
    );
  }
}
