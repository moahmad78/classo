import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StructureService } from './structure.service.js';
import { TenantAuthGuard } from '../../common/guards/tenant.guard.js';
import type { AuthenticatedRequest } from '../../common/guards/tenant.guard.js';
import {
  CreateClassSchema,
  CreateSectionSchema,
  CreateBatchSchema,
  CreateSubjectSchema,
} from './structure.dto.js';

@ApiTags('Academic Structure (SET-02)')
@ApiBearerAuth()
@UseGuards(TenantAuthGuard)
@Controller('structure')
export class StructureController {
  constructor(private readonly structureService: StructureService) {}

  @Get('classes')
  @ApiOperation({ summary: 'List classes (SET-02)' })
  async listClasses(@Req() req: AuthenticatedRequest) {
    return this.structureService.listClasses(req.instituteId!);
  }

  @Post('classes')
  @ApiOperation({ summary: 'Create class (SET-02)' })
  async createClass(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parse = CreateClassSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.structureService.createClass(req.instituteId!, parse.data);
  }

  @Get('sections')
  @ApiOperation({ summary: 'List sections for a class (SET-02)' })
  async listSections(@Req() req: AuthenticatedRequest, @Query('classId') classId?: string) {
    return this.structureService.listSections(req.instituteId!, classId);
  }

  @Post('sections')
  @ApiOperation({ summary: 'Create section (SET-02)' })
  async createSection(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parse = CreateSectionSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.structureService.createSection(req.instituteId!, parse.data);
  }

  @Get('batches')
  @ApiOperation({ summary: 'List batches for coaching (SET-02)' })
  async listBatches(@Req() req: AuthenticatedRequest) {
    return this.structureService.listBatches(req.instituteId!);
  }

  @Post('batches')
  @ApiOperation({ summary: 'Create batch (SET-02)' })
  async createBatch(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parse = CreateBatchSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.structureService.createBatch(req.instituteId!, parse.data);
  }

  @Get('subjects')
  @ApiOperation({ summary: 'List subjects (SET-02)' })
  async listSubjects(@Req() req: AuthenticatedRequest) {
    return this.structureService.listSubjects(req.instituteId!);
  }

  @Post('subjects')
  @ApiOperation({ summary: 'Create subject (SET-02)' })
  async createSubject(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parse = CreateSubjectSchema.safeParse(body);
    if (!parse.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', details: parse.error.errors });
    }
    return this.structureService.createSubject(req.instituteId!, parse.data);
  }
}
