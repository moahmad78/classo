import { z } from 'zod';
import { INSTITUTE_TYPES } from '@classo/config';

// PRD REG-02 Registration Form Schema
export const RegisterInstituteSchema = z.object({
  instituteName: z.string().min(3, 'Institute name must be at least 3 characters').max(255),
  instituteType: z.enum(INSTITUTE_TYPES),
  state: z.string().min(2, 'State is required'),
  city: z.string().min(2, 'City is required'),
  pinCode: z.string().regex(/^\d{6}$/, 'PIN Code must be a 6-digit number'),
  address: z.string().min(5, 'Address is required'),
  officialPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Valid phone number required'),
  officialEmail: z.string().email('Valid official email required'),
  principalName: z.string().min(2, 'Principal name is required'),
  principalPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Valid principal phone required'),
  principalEmail: z.string().email('Valid principal email required'),
  affiliationNumber: z.string().optional(),
  approxStudentCount: z.number().int().positive().default(100),
  preferredSubdomain: z.string().min(3).max(30),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms and Privacy Policy.' }),
  }),
});

export type RegisterInstituteInput = z.infer<typeof RegisterInstituteSchema>;

// PRD REG-03 OTP Verification Schema
export const VerifyOtpSchema = z.object({
  applicationId: z.string().uuid(),
  channel: z.enum(['email', 'phone']),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

// PRD REG-06 Application Tracking Schema
export const TrackApplicationSchema = z.object({
  trackingCode: z.string().min(4),
  phoneOrEmail: z.string().min(3),
});

export type TrackApplicationInput = z.infer<typeof TrackApplicationSchema>;

// PRD REG-07 Approval Queue Actions
export const ReviewApplicationSchema = z.object({
  action: z.enum(['approve', 'reject', 'needs_info']),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
  trialDays: z.number().int().positive().default(14),
});

export type ReviewApplicationInput = z.infer<typeof ReviewApplicationSchema>;
