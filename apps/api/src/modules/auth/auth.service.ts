import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { eq, or, and } from 'drizzle-orm';
import { institutes, users, invites, getPool, createDrizzleClient } from '@classo/db';
import { PasswordService } from '../../common/auth/password.service.js';
import { JwtAuthService } from '../../common/auth/jwt.service.js';
import { RoleLoginInput, SetPasswordFromInviteInput } from './auth.dto.js';
import crypto from 'crypto';

@Injectable()
export class AuthService {
  private jwtService = new JwtAuthService();

  private getDb() {
    return createDrizzleClient(getPool());
  }

  /**
   * PRD USR-01, USR-09: Resolve institute branding by subdomain or code
   */
  async resolveInstitute(codeOrSubdomain: string) {
    const db = this.getDb();
    const query = codeOrSubdomain.trim().toLowerCase();

    const [institute] = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        type: institutes.type,
        subdomain: institutes.subdomain,
        code: institutes.code,
        status: institutes.status,
        logoUrl: institutes.logoUrl,
        brandingColors: institutes.brandingColors,
      })
      .from(institutes)
      .where(
        or(
          eq(institutes.subdomain, query),
          eq(institutes.code, query.toUpperCase())
        )
      )
      .limit(1);

    if (!institute) {
      throw new NotFoundException({
        code: 'INSTITUTE_NOT_FOUND',
        message: 'Ye institute nahi mila. Kripya code ya subdomain check karein.',
      });
    }

    return institute;
  }

  /**
   * PRD USR-01, USR-07: Role-selector authentication with database role enforcement
   */
  async loginWithRole(input: RoleLoginInput) {
    const db = this.getDb();
    const identifier = input.identifier.trim();

    // 1. Fetch user matching institute and identifier
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.instituteId, input.instituteId),
          or(eq(users.email, identifier), eq(users.phone, identifier))
        )
      )
      .limit(1);

    // Constant-time check / generic message to prevent user enumeration
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Mobile/Email ya password galat hai.',
      });
    }

    // 2. Check account lock (PRD USR-02)
    const failedAttempts = user.failedLoginAttempts || { count: 0 };
    if (failedAttempts.lockedUntil) {
      const lockTime = new Date(failedAttempts.lockedUntil).getTime();
      if (Date.now() < lockTime) {
        const remainingMinutes = Math.ceil((lockTime - Date.now()) / (60 * 1000));
        throw new UnauthorizedException({
          code: 'ACCOUNT_LOCKED',
          message: `Bahut saare galat attempts. Account ${remainingMinutes} minute ke liye lock hai.`,
        });
      }
    }

    // 3. Verify password with argon2id
    const passwordValid = await PasswordService.verify(user.passwordHash, input.password);
    if (!passwordValid) {
      const newCount = (failedAttempts.count || 0) + 1;
      const lockUpdate =
        newCount >= 5
          ? { count: newCount, lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString() }
          : { count: newCount };

      await db
        .update(users)
        .set({ failedLoginAttempts: lockUpdate })
        .where(eq(users.id, user.id));

      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Mobile/Email ya password galat hai.',
      });
    }

    // 4. PRD USR-07: Database role verification
    if (user.role !== input.role) {
      throw new UnauthorizedException({
        code: 'ROLE_MISMATCH',
        message: `Aapka account '${input.role}' role ke liye registered nahi hai. Sahi role chunein.`,
      });
    }

    // 5. Reset failed attempts
    await db
      .update(users)
      .set({ failedLoginAttempts: { count: 0 } })
      .where(eq(users.id, user.id));

    // 6. Generate tokens
    const accessToken = this.jwtService.generateAccessToken({
      sub: user.id,
      instituteId: user.instituteId,
      role: user.role,
      permissions: ['*'], // Default admin/assigned permissions; extended in RBAC
    });

    const { token: refreshToken } = this.jwtService.generateRefreshToken(
      user.id,
      user.instituteId
    );

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: 15 * 60,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        instituteId: user.instituteId,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  /**
   * PRD USR-03: Set password using one-time 72h invite token
   */
  async setPasswordFromInvite(input: SetPasswordFromInviteInput) {
    const db = this.getDb();
    const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.tokenHash, tokenHash))
      .limit(1);

    if (!invite) {
      throw new NotFoundException({
        code: 'INVALID_INVITE',
        message: 'Ye invite link valid nahi hai ya pehle use ho chuka hai.',
      });
    }

    if (new Date() > new Date(invite.expiresAt)) {
      throw new BadRequestException({
        code: 'INVITE_EXPIRED',
        message: 'Ye invite link expire ho chuka hai. Naya invite request karein.',
      });
    }

    if (invite.acceptedAt) {
      throw new BadRequestException({
        code: 'INVITE_ALREADY_USED',
        message: 'Ye invite link pehle hi accept ho chuka hai. Direct login karein.',
      });
    }

    // Hash new password with argon2id
    const passwordHash = await PasswordService.hash(input.newPassword);

    // Update user matching invite
    await db
      .update(users)
      .set({ passwordHash })
      .where(
        and(
          eq(users.instituteId, invite.instituteId),
          or(eq(users.email, invite.email || ''), eq(users.phone, invite.phone || ''))
        )
      );

    // Mark invite accepted
    await db
      .update(invites)
      .set({ acceptedAt: new Date() })
      .where(eq(invites.id, invite.id));

    return {
      success: true,
      message: 'Password set ho gaya! Ab aap login kar sakte hain.',
    };
  }
}
