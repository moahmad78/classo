import { z } from 'zod';

// PRD STF-15: Teacher Onboarding by Principal
export const InviteTeacherSchema = z.object({
  fullName: z.string().min(2, 'Teacher full name is required').max(255),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Valid phone number is required'),
  designation: z.string().min(2, 'Designation is required').max(100), // e.g. "Senior PGT Physics"
  departmentId: z.string().uuid('Department is required'),
  joiningDate: z.string().optional(),
  qualification: z.string().optional(),
});
export type InviteTeacherInput = z.infer<typeof InviteTeacherSchema>;

// PRD STF-04: Teaching Assignment (teacher <-> subject <-> class/section/batch)
export const AssignTeachingSchema = z.object({
  staffId: z.string().uuid(),
  subjectId: z.string().uuid(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
});
export type AssignTeachingInput = z.infer<typeof AssignTeachingSchema>;

// PRD STF-03: Leave Management
export const CreateLeaveTypeSchema = z.object({
  name: z.string().min(2).max(100),
  daysAllowed: z.number().int().positive(),
  isPaid: z.boolean().default(true),
});
export type CreateLeaveTypeInput = z.infer<typeof CreateLeaveTypeSchema>;

export const SubmitLeaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(3),
});
export type SubmitLeaveRequestInput = z.infer<typeof SubmitLeaveRequestSchema>;

export const ReviewLeaveRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});
export type ReviewLeaveRequestInput = z.infer<typeof ReviewLeaveRequestSchema>;
