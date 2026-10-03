import { z } from 'zod';
import { INSTITUTE_ROLES } from '@classo/config';

// PRD USR-01: Institute Resolution
export const ResolveInstituteSchema = z.object({
  codeOrSubdomain: z.string().min(2).max(64),
});

export type ResolveInstituteInput = z.infer<typeof ResolveInstituteSchema>;

// PRD USR-01, USR-07, USR-10: Role-Selector Login
export const RoleLoginSchema = z.object({
  instituteId: z.string().uuid(),
  role: z.enum(INSTITUTE_ROLES),
  identifier: z.string().min(3, 'Email, phone or admission number required'),
  password: z.string().min(6, 'Password is required'),
});

export type RoleLoginInput = z.infer<typeof RoleLoginSchema>;

// PRD USR-03: Set Password from Invite
export const SetPasswordFromInviteSchema = z.object({
  token: z.string().min(16),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type SetPasswordFromInviteInput = z.infer<typeof SetPasswordFromInviteSchema>;

// PRD USR-08: Switch Role for multi-role user
export const SwitchRoleSchema = z.object({
  targetRole: z.enum(INSTITUTE_ROLES),
});

export type SwitchRoleInput = z.infer<typeof SwitchRoleSchema>;
