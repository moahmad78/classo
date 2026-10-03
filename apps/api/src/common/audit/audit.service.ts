import { auditLog } from '@classo/db';
import { createDrizzleClient } from '@classo/db';

export interface AuditRecordInput {
  instituteId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  diff?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Records an immutable audit log entry (PRD CC-05, ISO-05)
   */
  static async record(
    db: ReturnType<typeof createDrizzleClient>,
    input: AuditRecordInput
  ) {
    return db.insert(auditLog).values({
      instituteId: input.instituteId,
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      diff: input.diff,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }
}
