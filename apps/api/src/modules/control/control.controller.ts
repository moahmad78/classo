import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ControlService } from './control.service.js';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'grace', 'read_only', 'churned']),
  reason: z.string().optional(),
});

const ToggleFlagSchema = z.object({
  isEnabled: z.boolean(),
});

@ApiTags('Classo Control Center (Internal)')
@Controller('control')
export class ControlController {
  constructor(private readonly controlService: ControlService) {}

  @Get('institutes')
  @ApiOperation({ summary: 'List all institutes across platform (CTL-01)' })
  async listInstitutes() {
    return this.controlService.listInstitutes();
  }

  @Patch('institutes/:id/status')
  @ApiOperation({ summary: 'Change institute status (e.g. suspend, reactivate) (CTL-01)' })
  async updateStatus(@Param('id') id: string, @Body() body: unknown) {
    const parseResult = UpdateStatusSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Invalid status payload.',
        details: parseResult.error.errors,
      });
    }
    return this.controlService.updateInstituteStatus(id, parseResult.data.status, parseResult.data.reason);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List plans and limits (CTL-03)' })
  async listPlans() {
    return this.controlService.listPlans();
  }

  @Get('flags')
  @ApiOperation({ summary: 'List feature flags (CTL-06)' })
  async listFlags() {
    return this.controlService.listFeatureFlags();
  }

  @Patch('flags/:key')
  @ApiOperation({ summary: 'Toggle feature flag globally (CTL-06)' })
  async toggleFlag(@Param('key') key: string, @Body() body: unknown) {
    const parseResult = ToggleFlagSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Invalid flag payload.',
      });
    }
    return this.controlService.toggleFeatureFlag(key, parseResult.data.isEnabled);
  }
}
