import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import {
  institutes,
  plans,
  featureFlags,
  platformAuditLog,
  getPool,
  createDrizzleClient,
} from '@classo/db';

@Injectable()
export class ControlService {
  private getDb() {
    return createDrizzleClient(getPool());
  }

  /**
   * PRD CTL-01: List institutes with status and plan
   */
  async listInstitutes() {
    const db = this.getDb();
    return db
      .select()
      .from(institutes)
      .orderBy(desc(institutes.createdAt));
  }

  /**
   * PRD CTL-01: Update institute status (e.g. suspend, reactivate)
   */
  async updateInstituteStatus(
    instituteId: string,
    status: 'active' | 'suspended' | 'grace' | 'read_only' | 'churned',
    reason?: string,
    actorId?: string
  ) {
    const db = this.getDb();
    const [updated] = await db
      .update(institutes)
      .set({ status, updatedAt: new Date() })
      .where(eq(institutes.id, instituteId))
      .returning();

    if (!updated) {
      throw new NotFoundException({ code: 'INSTITUTE_NOT_FOUND', message: 'Institute not found.' });
    }

    // Audit log
    await db.insert(platformAuditLog).values({
      actorId,
      actorType: 'company_user',
      action: `institute.status_changed.${status}`,
      entityType: 'institute',
      entityId: instituteId,
      details: { status, reason },
    });

    return updated;
  }

  /**
   * PRD CTL-03: List plans and limits
   */
  async listPlans() {
    const db = this.getDb();
    return db.select().from(plans);
  }

  /**
   * PRD CTL-06: List feature flags
   */
  async listFeatureFlags() {
    const db = this.getDb();
    return db.select().from(featureFlags);
  }

  /**
   * PRD CTL-06: Toggle feature flag
   */
  async toggleFeatureFlag(key: string, isEnabled: boolean, actorId?: string) {
    const db = this.getDb();
    const [flag] = await db
      .update(featureFlags)
      .set({ isEnabledGlobally: isEnabled, updatedAt: new Date() })
      .where(eq(featureFlags.key, key))
      .returning();

    if (!flag) {
      throw new NotFoundException({ code: 'FLAG_NOT_FOUND', message: 'Feature flag not found.' });
    }

    await db.insert(platformAuditLog).values({
      actorId,
      actorType: 'company_user',
      action: 'feature_flag.toggled',
      entityType: 'feature_flag',
      entityId: key,
      details: { key, isEnabled },
    });

    return flag;
  }
}
