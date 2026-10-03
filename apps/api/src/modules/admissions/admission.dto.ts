import { z } from 'zod';

// PRD ADM-02: Lead / Inquiry CRM
export const CreateInquirySchema = z.object({
  studentName: z.string().min(2, 'Student name is required'),
  parentName: z.string().min(2, 'Parent name is required'),
  parentPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Valid parent phone is required'),
  parentEmail: z.string().email().optional(),
  gradeApplyingFor: z.string().min(1, 'Grade applying for is required'),
  source: z.string().default('direct'),
  notes: z.string().optional(),
});
export type CreateInquiryInput = z.infer<typeof CreateInquirySchema>;

export const UpdateInquiryStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'demo_visit', 'applied', 'admitted', 'lost']),
  notes: z.string().optional(),
});
export type UpdateInquiryStatusInput = z.infer<typeof UpdateInquiryStatusSchema>;

// PRD ADM-01: Public Online Student Admission Application
export const SubmitStudentApplicationSchema = z.object({
  studentName: z.string().min(2, 'Student full name is required'),
  dob: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  parentName: z.string().min(2, 'Parent name is required'),
  parentPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Valid parent phone is required'),
  parentEmail: z.string().email('Valid parent email is required'),
  gradeApplyingFor: z.string().min(1, 'Class or course is required'),
  address: z.string().optional(),
});
export type SubmitStudentApplicationInput = z.infer<typeof SubmitStudentApplicationSchema>;
