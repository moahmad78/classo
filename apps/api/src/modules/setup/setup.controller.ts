import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SetupService } from './setup.service.js';
import { TenantAuthGuard } from '../../common/guards/tenant.guard.js';
import type { AuthenticatedRequest } from '../../common/guards/tenant.guard.js';
import {
  CreateDepartmentSchema,
  CreateCampusLocationSchema,
} from './setup.dto.js';

@ApiTags('Institute Setup & Wizard (Admin)')
@ApiBearerAuth()
@UseGuards(TenantAuthGuard)
@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('wizard-status')
  @ApiOperation({ summary: 'Get first-login setup wizard progress (SET-01)' })
  async getStatus(@Req() req: AuthenticatedRequest) {
    return this.setupService.getWizardStatus(req.instituteId!);
  }

  @Get('departments')
  @ApiOperation({ summary: 'List institute departments (SET-05)' })
  async listDepartments(@Req() req: AuthenticatedRequest) {
    return this.setupService.listDepartments(req.instituteId!);
  }

  @Post('departments')
  @ApiOperation({ summary: 'Create department (SET-05)' })
  async createDepartment(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parseResult = CreateDepartmentSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Invalid department data.',
        details: parseResult.error.errors,
      });
    }
    return this.setupService.createDepartment(req.instituteId!, parseResult.data);
  }

  @Get('campus-locations')
  @ApiOperation({ summary: 'List campus geofence locations (SET-06)' })
  async listCampusLocations(@Req() req: AuthenticatedRequest) {
    return this.setupService.listCampusLocations(req.instituteId!);
  }

  @Post('campus-locations')
  @ApiOperation({ summary: 'Create campus geofence location for selfie attendance (SET-06)' })
  async createCampusLocation(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parseResult = CreateCampusLocationSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Invalid campus location data.',
        details: parseResult.error.errors,
      });
    }
    return this.setupService.createCampusLocation(req.instituteId!, parseResult.data);
  }
}
