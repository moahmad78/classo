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
import { StudentService } from './student.service.js';
import { TenantAuthGuard } from '../../common/guards/tenant.guard.js';
import type { AuthenticatedRequest } from '../../common/guards/tenant.guard.js';
import {
  CreateStudentSchema,
  UpdateStudentStatusSchema,
  BulkImportStudentRowSchema,
} from './student.dto.js';
import { z } from 'zod';

const BulkImportRequestSchema = z.object({
  rows: z.array(BulkImportStudentRowSchema),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  dryRun: z.boolean().default(true),
});

@ApiTags('Student Management (STU-*)')
@ApiBearerAuth()
@UseGuards(TenantAuthGuard)
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @ApiOperation({ summary: 'Create student profile (STU-01, STU-02)' })
  async create(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parse = CreateStudentSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.studentService.createStudent(req.instituteId!, parse.data, req.user?.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List students with filters & pagination (STU-03, PERF-02)' })
  async list(
    @Req() req: AuthenticatedRequest,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('batchId') batchId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.studentService.listStudents(req.instituteId!, {
      classId,
      sectionId,
      batchId,
      status,
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update student status (STU-05)' })
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    const parse = UpdateStudentStatusSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.studentService.updateStatus(req.instituteId!, id, parse.data, req.user?.sub);
  }

  @Post('bulk-import')
  @ApiOperation({ summary: 'Bulk CSV/Excel student import with dry-run report (STU-06, CC-06)' })
  async bulkImport(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parse = BulkImportRequestSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.studentService.bulkImport(
      req.instituteId!,
      parse.data.rows,
      parse.data.classId,
      parse.data.sectionId,
      parse.data.dryRun
    );
  }
}
