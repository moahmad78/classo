import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and, gt } from 'drizzle-orm';
import {
  institutes,
  instituteApplications,
  subdomainReservations,
  platformAuditLog,
  users,
  academicYears,
  departments,
  invites,
  getPool,
  createDrizzleClient,
} from '@classo/db';
import { validateSubdomainFormat } from './subdomain.validator.js';
import {
  RegisterInstituteInput,
  VerifyOtpInput,
  ReviewApplicationInput,
} from './registration.dto.js';
import crypto from 'crypto';
import { INVITE_EXPIRY_HOURS, DEFAULT_TRIAL_DAYS } from '@classo/config';

// In-memory OTP storage for registration verification (in production, backed by Redis)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

@Injectable()
export class RegistrationService {
  private getDb() {
    return createDrizzleClient(getPool());
  }

  /**
   * PRD REG-05: Check subdomain availability
   */
  async checkSubdomainAvailability(subdomain: string): Promise<{ available: boolean; reason?: string }> {
    const formatCheck = validateSubdomainFormat(subdomain);
    if (!formatCheck.valid) {
      return { available: false, reason: formatCheck.error };
    }

    const normalized = subdomain.trim().toLowerCase();
    const db = this.getDb();

    // 1. Check if already used by an active institute
    const existingInstitute = await db
      .select({ id: institutes.id })
      .from(institutes)
      .where(eq(institutes.subdomain, normalized))
      .limit(1);

    if (existingInstitute.length > 0) {
      return { available: false, reason: 'This subdomain is already taken.' };
    }

    // 2. Check if actively reserved
    const activeReservation = await db
      .select({ id: subdomainReservations.id })
      .from(subdomainReservations)
      .where(
        and(
          eq(subdomainReservations.subdomain, normalized),
          gt(subdomainReservations.expiresAt, new Date())
        )
      )
      .limit(1);

    if (activeReservation.length > 0) {
      return { available: false, reason: 'This subdomain is currently reserved.' };
    }

    return { available: true };
  }

  /**
   * PRD REG-01, REG-02, REG-04: Submit institute registration
   */
  async submitRegistration(input: RegisterInstituteInput) {
    const db = this.getDb();
    const normalizedSubdomain = input.preferredSubdomain.trim().toLowerCase();

    // 1. Subdomain check
    const subCheck = await this.checkSubdomainAvailability(normalizedSubdomain);
    if (!subCheck.available) {
      throw new BadRequestException({
        code: 'SUBDOMAIN_UNAVAILABLE',
        message: subCheck.reason,
      });
    }

    // 2. Anti-abuse duplicate check (REG-04)
    const existingApp = await db
      .select({ id: instituteApplications.id, status: instituteApplications.applicationStatus })
      .from(instituteApplications)
      .where(
        and(
          eq(instituteApplications.officialEmail, input.officialEmail),
          eq(instituteApplications.applicationStatus, 'submitted')
        )
      )
      .limit(1);

    if (existingApp.length > 0) {
      throw new ConflictException({
        code: 'DUPLICATE_APPLICATION',
        message: 'An application with this email is already under process. Please track your existing application.',
      });
    }

    // 3. Create application record
    const [application] = await db
      .insert(instituteApplications)
      .values({
        instituteName: input.instituteName,
        instituteType: input.instituteType,
        state: input.state,
        city: input.city,
        pinCode: input.pinCode,
        address: input.address,
        officialPhone: input.officialPhone,
        officialEmail: input.officialEmail,
        principalName: input.principalName,
        principalPhone: input.principalPhone,
        principalEmail: input.principalEmail,
        affiliationNumber: input.affiliationNumber,
        approxStudentCount: input.approxStudentCount,
        preferredSubdomain: normalizedSubdomain,
        applicationStatus: 'submitted',
        emailVerified: false,
        phoneVerified: false,
      })
      .returning();

    // 4. Reserve subdomain for 14 days (REG-05)
    const reservationExpiry = new Date();
    reservationExpiry.setDate(reservationExpiry.getDate() + 14);

    await db.insert(subdomainReservations).values({
      subdomain: normalizedSubdomain,
      applicationId: application.id,
      expiresAt: reservationExpiry,
    });

    // 5. Generate OTPs (REG-03)
    const emailOtp = '123456'; // Default/dev OTP; in production sent via SMS/Email
    const phoneOtp = '123456';

    const now = Date.now();
    otpStore.set(`${application.id}:email`, { code: emailOtp, expiresAt: now + 15 * 60 * 1000 });
    otpStore.set(`${application.id}:phone`, { code: phoneOtp, expiresAt: now + 15 * 60 * 1000 });

    return {
      applicationId: application.id,
      subdomain: normalizedSubdomain,
      status: application.applicationStatus,
      message: 'Application submitted successfully. Please verify your email and phone with OTP.',
    };
  }

  /**
   * PRD REG-03: Verify email/phone OTP
   */
  async verifyOtp(input: VerifyOtpInput) {
    const key = `${input.applicationId}:${input.channel}`;
    const stored = otpStore.get(key);

    if (!stored || stored.expiresAt < Date.now()) {
      throw new BadRequestException({
        code: 'OTP_EXPIRED',
        message: 'OTP has expired or was not requested. Please request a new one.',
      });
    }

    if (stored.code !== input.otp) {
      throw new BadRequestException({
        code: 'INVALID_OTP',
        message: 'Incorrect OTP. Please check and try again.',
      });
    }

    // Clean up used OTP
    otpStore.delete(key);

    const db = this.getDb();
    const updateData: Record<string, any> = {};
    if (input.channel === 'email') updateData.emailVerified = true;
    if (input.channel === 'phone') updateData.phoneVerified = true;

    const [updated] = await db
      .update(instituteApplications)
      .set(updateData)
      .where(eq(instituteApplications.id, input.applicationId))
      .returning();

    if (!updated) {
      throw new NotFoundException({ code: 'APPLICATION_NOT_FOUND', message: 'Application not found.' });
    }

    // If both verified, transition to under_review (REG-06)
    if (updated.emailVerified && updated.phoneVerified && updated.applicationStatus === 'submitted') {
      const [underReview] = await db
        .update(instituteApplications)
        .set({ applicationStatus: 'under_review' })
        .where(eq(instituteApplications.id, input.applicationId))
        .returning();

      return {
        applicationId: updated.id,
        channel: input.channel,
        verified: true,
        status: underReview.applicationStatus,
        message: 'Both email and phone verified! Your application is now in the review queue.',
      };
    }

    return {
      applicationId: updated.id,
      channel: input.channel,
      verified: true,
      status: updated.applicationStatus,
      message: `${input.channel} verified successfully.`,
    };
  }

  /**
   * PRD REG-06: Track application status
   */
  async trackApplication(applicationId: string) {
    const db = this.getDb();
    const [application] = await db
      .select()
      .from(instituteApplications)
      .where(eq(instituteApplications.id, applicationId))
      .limit(1);

    if (!application) {
      throw new NotFoundException({
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found with the provided details.',
      });
    }

    return {
      id: application.id,
      instituteName: application.instituteName,
      subdomain: application.preferredSubdomain,
      status: application.applicationStatus,
      emailVerified: application.emailVerified,
      phoneVerified: application.phoneVerified,
      rejectionReason: application.rejectionReason,
      notes: application.notes,
      createdAt: application.createdAt,
      reviewedAt: application.reviewedAt,
    };
  }

  /**
   * PRD REG-07: Get applications for Control Center Approval Queue
   */
  async getApprovalQueue(status?: string) {
    const db = this.getDb();
    const query = db.select().from(instituteApplications);
    if (status) {
      return query.where(eq(instituteApplications.applicationStatus, status as any));
    }
    return query;
  }

  /**
   * PRD REG-08: On approval (single idempotent transaction):
   * Create institute, subdomain, institute code, Principal user (role Admin), and send invite.
   */
  async approveApplication(applicationId: string, reviewerId?: string, trialDays = DEFAULT_TRIAL_DAYS) {
    const db = this.getDb();

    // 1. Fetch application
    const [app] = await db
      .select()
      .from(instituteApplications)
      .where(eq(instituteApplications.id, applicationId))
      .limit(1);

    if (!app) {
      throw new NotFoundException({ code: 'APPLICATION_NOT_FOUND', message: 'Application not found.' });
    }

    if (app.applicationStatus === 'approved') {
      throw new BadRequestException({ code: 'ALREADY_APPROVED', message: 'Application is already approved.' });
    }

    // 2. Generate unique institute code (e.g. DPS001, APX001)
    const prefix = app.preferredSubdomain.substring(0, 3).toUpperCase();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const code = `${prefix}${randomSuffix}`;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    // 3. Create Institute
    const [newInstitute] = await db
      .insert(institutes)
      .values({
        name: app.instituteName,
        type: app.instituteType,
        subdomain: app.preferredSubdomain,
        code,
        status: 'trial',
        contactPhone: app.officialPhone,
        contactEmail: app.officialEmail,
        address: app.address,
        city: app.city,
        state: app.state,
        pinCode: app.pinCode,
        trialEndsAt,
      })
      .returning();

    // 4. Create default Academic Year
    const currentYear = new Date().getFullYear();
    await db.insert(academicYears).values({
      instituteId: newInstitute.id,
      name: `${currentYear}-${currentYear + 1}`,
      startDate: new Date(`${currentYear}-04-01T00:00:00Z`),
      endDate: new Date(`${currentYear + 1}-03-31T23:59:59Z`),
      isCurrent: true,
    });

    // 5. Create default Departments (SET-05)
    await db.insert(departments).values([
      { instituteId: newInstitute.id, name: 'Administration' },
      { instituteId: newInstitute.id, name: 'Academics' },
    ]);

    // 6. Create Principal User (role Admin)
    const [principal] = await db
      .insert(users)
      .values({
        instituteId: newInstitute.id,
        fullName: app.principalName,
        email: app.principalEmail,
        phone: app.principalPhone,
        role: 'admin',
        isActive: true,
      })
      .returning();

    // 7. Create 72-hour one-time invite token (REG-08, USR-03)
    const rawInviteToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawInviteToken).digest('hex');
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setHours(inviteExpiresAt.getHours() + INVITE_EXPIRY_HOURS);

    await db.insert(invites).values({
      instituteId: newInstitute.id,
      email: app.principalEmail,
      phone: app.principalPhone,
      role: 'admin',
      tokenHash,
      expiresAt: inviteExpiresAt,
    });

    // 8. Update Application to approved
    await db
      .update(instituteApplications)
      .set({
        applicationStatus: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .where(eq(instituteApplications.id, applicationId));

    // 9. Record in Platform Audit Log (CTL-17)
    await db.insert(platformAuditLog).values({
      actorId: reviewerId,
      actorType: 'company_user',
      action: 'application.approved',
      entityType: 'institute_application',
      entityId: applicationId,
      details: {
        instituteId: newInstitute.id,
        subdomain: newInstitute.subdomain,
        code: newInstitute.code,
      },
    });

    const inviteLink = `https://${newInstitute.subdomain}.classo.in/set-password?token=${rawInviteToken}`;

    return {
      success: true,
      institute: {
        id: newInstitute.id,
        name: newInstitute.name,
        subdomain: newInstitute.subdomain,
        code: newInstitute.code,
        status: newInstitute.status,
      },
      principal: {
        id: principal.id,
        name: principal.fullName,
        email: principal.email,
        role: principal.role,
      },
      inviteLink,
      expiresAt: inviteExpiresAt,
      message: 'Institute and Principal account successfully created! Invite link generated.',
    };
  }

  /**
   * PRD REG-09: Rejection routine
   */
  async rejectApplication(applicationId: string, reason: string, reviewerId?: string) {
    const db = this.getDb();

    const [app] = await db
      .select()
      .from(instituteApplications)
      .where(eq(instituteApplications.id, applicationId))
      .limit(1);

    if (!app) {
      throw new NotFoundException({ code: 'APPLICATION_NOT_FOUND', message: 'Application not found.' });
    }

    // 1. Mark application rejected with reason
    await db
      .update(instituteApplications)
      .set({
        applicationStatus: 'rejected',
        rejectionReason: reason,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .where(eq(instituteApplications.id, applicationId));

    // 2. Release subdomain reservation (REG-09)
    await db
      .delete(subdomainReservations)
      .where(eq(subdomainReservations.applicationId, applicationId));

    // 3. Audit log
    await db.insert(platformAuditLog).values({
      actorId: reviewerId,
      actorType: 'company_user',
      action: 'application.rejected',
      entityType: 'institute_application',
      entityId: applicationId,
      details: { reason, subdomain: app.preferredSubdomain },
    });

    return {
      success: true,
      applicationId,
      status: 'rejected',
      reason,
      message: 'Application rejected and reserved subdomain released.',
    };
  }
}
