import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegistrationService } from './registration.service.js';
import {
  RegisterInstituteSchema,
  VerifyOtpSchema,
  ReviewApplicationSchema,
} from './registration.dto.js';

@ApiTags('Institute Self-Registration (Public)')
@Controller('registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Get('subdomain-check')
  @ApiOperation({ summary: 'Check preferred subdomain availability (REG-05)' })
  async checkSubdomain(@Query('subdomain') subdomain: string) {
    if (!subdomain) {
      throw new BadRequestException({
        code: 'MISSING_SUBDOMAIN',
        message: 'Subdomain query parameter is required.',
      });
    }
    return this.registrationService.checkSubdomainAvailability(subdomain);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Submit new institute registration form (REG-01, REG-02)' })
  async apply(@Body() body: unknown) {
    const parseResult = RegisterInstituteSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: parseResult.error.errors[0]?.message || 'Invalid registration form data.',
        details: parseResult.error.errors,
      });
    }
    return this.registrationService.submitRegistration(parseResult.data);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify email or phone OTP for application (REG-03)' })
  async verifyOtp(@Body() body: unknown) {
    const parseResult = VerifyOtpSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Invalid OTP payload.',
        details: parseResult.error.errors,
      });
    }
    return this.registrationService.verifyOtp(parseResult.data);
  }

  @Get('track/:id')
  @ApiOperation({ summary: 'Track application status (REG-06)' })
  async track(@Param('id') id: string) {
    return this.registrationService.trackApplication(id);
  }
}

@ApiTags('Control Center — Registration Approval Queue')
@Controller('control/applications')
export class ControlApplicationsController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Get()
  @ApiOperation({ summary: 'List submitted applications for review (REG-07, CTL-02)' })
  async list(@Query('status') status?: string) {
    return this.registrationService.getApprovalQueue(status);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Approve, Reject, or Request Info for an application (REG-07..09)' })
  async review(@Param('id') id: string, @Body() body: unknown) {
    const parseResult = ReviewApplicationSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Invalid review action.',
        details: parseResult.error.errors,
      });
    }

    const { action, rejectionReason, trialDays } = parseResult.data;

    if (action === 'approve') {
      return this.registrationService.approveApplication(id, undefined, trialDays);
    } else if (action === 'reject') {
      if (!rejectionReason) {
        throw new BadRequestException({
          code: 'REASON_REQUIRED',
          message: 'Mandatory rejection reason must be provided (REG-07).',
        });
      }
      return this.registrationService.rejectApplication(id, rejectionReason);
    }

    return { success: true, message: 'Action recorded.' };
  }
}
