import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  notices,
  noticeReads,
  notifications,
  users,
  auditLog,
} from '@classo/db';
import { eq, and, sql, desc, or } from 'drizzle-orm';
import type { CreateNoticeDto, QueryNoticeDto } from './communication.dto';

@Injectable()
export class CommunicationService {
  constructor(private readonly dbService: DatabaseService) {}

  // -------------------------------------------------------------
  // NOTICES (COM-01)
  // -------------------------------------------------------------

  async createNotice(tenantId: string, userId: string, dto: CreateNoticeDto) {
    const db = this.dbService.getDb();

    const publishAt = dto.publishAt ? new Date(dto.publishAt) : new Date();
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

    const [notice] = await db
      .insert(notices)
      .values({
        instituteId: tenantId,
        title: dto.title,
        content: dto.content,
        audienceType: dto.audienceType,
        targetAudience: dto.targetAudience ?? [],
        publishAt,
        expiresAt,
        attachments: dto.attachments ?? [],
        readReceiptsEnabled: dto.readReceiptsEnabled ?? false,
        createdBy: userId,
      })
      .returning();

    // Trigger notification to targeted users (COM-05)
    let targetUsersQuery;
    if (dto.audienceType === 'all') {
      targetUsersQuery = db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.instituteId, tenantId), eq(users.isActive, true)));
    } else if (dto.audienceType === 'role' && dto.targetAudience?.length) {
      targetUsersQuery = db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.instituteId, tenantId),
            eq(users.isActive, true),
            sql`${users.role} = ANY(${dto.targetAudience})`
          )
        );
    }

    if (targetUsersQuery) {
      const targetUsers = await targetUsersQuery;
      for (const u of targetUsers) {
        if (u.id !== userId) {
          await db.insert(notifications).values({
            instituteId: tenantId,
            userId: u.id,
            title: `Notice: ${dto.title}`,
            message: dto.content.length > 120 ? `${dto.content.slice(0, 117)}...` : dto.content,
            type: 'notice',
            link: `/notices`,
          });
        }
      }
    }

    await db.insert(auditLog).values({
      instituteId: tenantId,
      userId,
      action: 'notice.created',
      entityType: 'notices',
      entityId: notice.id,
      diff: { title: dto.title, audienceType: dto.audienceType },
    });

    return notice;
  }

  async getNotices(tenantId: string, userRole: string, userId: string) {
    const db = this.dbService.getDb();
    const now = new Date();

    const allNotices = await db
      .select({
        id: notices.id,
        title: notices.title,
        content: notices.content,
        audienceType: notices.audienceType,
        targetAudience: notices.targetAudience,
        publishAt: notices.publishAt,
        expiresAt: notices.expiresAt,
        attachments: notices.attachments,
        readReceiptsEnabled: notices.readReceiptsEnabled,
        createdAt: notices.createdAt,
      })
      .from(notices)
      .where(
        and(
          eq(notices.instituteId, tenantId),
          eq(notices.isPublished, true),
          sql`${notices.publishAt} <= ${now}`
        )
      )
      .orderBy(desc(notices.publishAt));

    // Filter applicable notices by user role if not 'Admin'
    const userReads = await db
      .select({ noticeId: noticeReads.noticeId })
      .from(noticeReads)
      .where(and(eq(noticeReads.instituteId, tenantId), eq(noticeReads.userId, userId)));

    const readSet = new Set(userReads.map((r) => r.noticeId));

    const filtered = allNotices.filter((n) => {
      if (userRole === 'Admin' || n.audienceType === 'all') return true;
      if (n.audienceType === 'role' && Array.isArray(n.targetAudience)) {
        return n.targetAudience.includes(userRole);
      }
      return true;
    });

    return filtered.map((n) => ({
      ...n,
      isRead: readSet.has(n.id),
    }));
  }

  async markNoticeRead(tenantId: string, noticeId: string, userId: string) {
    const db = this.dbService.getDb();

    const [existing] = await db
      .select()
      .from(noticeReads)
      .where(
        and(
          eq(noticeReads.instituteId, tenantId),
          eq(noticeReads.noticeId, noticeId),
          eq(noticeReads.userId, userId)
        )
      );

    if (existing) {
      return { message: 'Notice already marked as read', readAt: existing.readAt };
    }

    const [readRec] = await db
      .insert(noticeReads)
      .values({
        instituteId: tenantId,
        noticeId,
        userId,
      })
      .returning();

    return { message: 'Notice marked as read', readAt: readRec.readAt };
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS (COM-05)
  // -------------------------------------------------------------

  async getNotifications(tenantId: string, userId: string) {
    const db = this.dbService.getDb();

    const list = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.instituteId, tenantId),
          eq(notifications.userId, userId)
        )
      )
      .orderBy(desc(notifications.createdAt));

    const unreadCount = list.filter((n) => !n.isRead).length;

    return {
      unreadCount,
      totalCount: list.length,
      notifications: list,
    };
  }

  async markNotificationRead(tenantId: string, notificationId: string, userId: string) {
    const db = this.dbService.getDb();

    const [updated] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.instituteId, tenantId),
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      throw new NotFoundException('Notification not found');
    }

    return updated;
  }

  async markAllNotificationsRead(tenantId: string, userId: string) {
    const db = this.dbService.getDb();

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.instituteId, tenantId),
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    return { message: 'All notifications marked as read' };
  }
}
