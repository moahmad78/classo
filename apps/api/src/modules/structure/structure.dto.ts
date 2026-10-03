import { z } from 'zod';

export const CreateClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100),
  code: z.string().min(1, 'Class code is required').max(50),
  departmentId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
});
export type CreateClassInput = z.infer<typeof CreateClassSchema>;

export const CreateSectionSchema = z.object({
  classId: z.string().uuid(),
  name: z.string().min(1, 'Section name is required (e.g. Section A)').max(50),
  capacity: z.number().int().positive().default(40),
  roomNumber: z.string().optional(),
});
export type CreateSectionInput = z.infer<typeof CreateSectionSchema>;

export const CreateBatchSchema = z.object({
  name: z.string().min(1, 'Batch name is required').max(100),
  code: z.string().min(1, 'Batch code is required').max(50),
  capacity: z.number().int().positive().default(60),
  academicYearId: z.string().uuid().optional(),
});
export type CreateBatchInput = z.infer<typeof CreateBatchSchema>;

export const CreateSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100),
  code: z.string().min(1, 'Subject code is required').max(50),
  departmentId: z.string().uuid().optional(),
});
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;
