import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import {
  RoleLoginSchema,
  SetPasswordFromInviteSchema,
} from './auth.dto.js';

@ApiTags('Authentication & Role Resolution')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('resolve')
  @ApiOperation({ summary: 'Resolve institute by code or subdomain (USR-01, USR-09)' })
  async resolve(@Query('query') query: string) {
    if (!query) {
      throw new BadRequestException({
        code: 'MISSING_QUERY',
        message: 'Query parameter (code or subdomain) is required.',
      });
    }
    return this.authService.resolveInstitute(query);
  }

  @Post('login-role')
  @ApiOperation({ summary: 'Login with selected role card (USR-01, USR-07)' })
  async loginWithRole(@Body() body: unknown) {
    const parseResult = RoleLoginSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: parseResult.error.errors[0]?.message || 'Invalid login payload.',
        details: parseResult.error.errors,
      });
    }
    return this.authService.loginWithRole(parseResult.data);
  }

  @Post('set-password')
  @ApiOperation({ summary: 'Set password from invite token (USR-03)' })
  async setPassword(@Body() body: unknown) {
    const parseResult = SetPasswordFromInviteSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: parseResult.error.errors[0]?.message || 'Invalid password payload.',
        details: parseResult.error.errors,
      });
    }
    return this.authService.setPasswordFromInvite(parseResult.data);
  }
}
