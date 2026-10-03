import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('System')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return {
      status: 'ok',
      service: 'Classo Core API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.1.0',
    };
  }
}
