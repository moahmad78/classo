import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import type { AuthenticatedRequest } from '../../auth/guards/tenant.guard';
import { CommunicationService } from './communication.service';
import { CreateNoticeDto } from './communication.dto';

@Controller()
@UseGuards(TenantGuard)
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  // -------------------------------------------------------------
  // NOTICES (COM-01)
  // -------------------------------------------------------------

  @Post('notices')
  async createNotice(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateNoticeDto
  ) {
    return this.communicationService.createNotice(
      req.tenantId,
      req.user.sub,
      dto
    );
  }

  @Get('notices')
  async getNotices(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getNotices(
      req.tenantId,
      req.user.role,
      req.user.sub
    );
  }

  @Post('notices/:id/read')
  async markNoticeRead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.communicationService.markNoticeRead(
      req.tenantId,
      id,
      req.user.sub
    );
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS (COM-05)
  // -------------------------------------------------------------

  @Get('notifications')
  async getNotifications(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getNotifications(
      req.tenantId,
      req.user.sub
    );
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.communicationService.markNotificationRead(
      req.tenantId,
      id,
      req.user.sub
    );
  }

  @Patch('notifications/read-all')
  async markAllNotificationsRead(@Req() req: AuthenticatedRequest) {
    return this.communicationService.markAllNotificationsRead(
      req.tenantId,
      req.user.sub
    );
  }
}
