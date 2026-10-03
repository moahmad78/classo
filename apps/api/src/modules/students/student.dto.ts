import { z } from 'zod';

export const CreateStudentSchema = z.object({
  fullName: z.string().min(2, 'Student full name is required').max(255),
  admissionNo: z.string().optional(), // Auto-generated if omitted (STU-02)
  rollNo: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  parentName: z.string().min(2, 'Parent name is required'),
  parentPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Valid parent phone is required'),
  parentEmail: z.string().email().optional(),
  address: z.string().optional(),
  medicalNotes: z.string().optional(),
});
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

export const UpdateStudentStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'alumni', 'transferred', 'dropped']),
  reason: z.string().optional(),
});
export type UpdateStudentStatusInput = z.infer<typeof UpdateStudentStatusSchema>;

export const BulkImportStudentRowSchema = z.object({
  fullName: z.string().min(1),
  parentName: z.string().min(1),
  parentPhone: z.string().min(10),
  parentEmail: z.string().optional(),
  gender: z.string().optional(),
  rollNo: z.string().optional(),
});
export type BulkImportStudentRow = z.infer<typeof BulkImportStudentRowSchema>;
