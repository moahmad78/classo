import { z } from 'zod';

// PRD SET-05 Departments Schema
export const CreateDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters').max(255),
  description: z.string().optional(),
  headOfDepartmentId: z.string().uuid().optional(),
});

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

// PRD SET-06 Campus Location Geofence Schema
export const CreateCampusLocationSchema = z.object({
  name: z.string().min(2, 'Location name is required (e.g. Main Campus)'),
  latitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Valid latitude required'),
  longitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Valid longitude required'),
  radiusMeters: z.string().regex(/^\d+$/, 'Radius must be in meters').default('150'),
});

export type CreateCampusLocationInput = z.infer<typeof CreateCampusLocationSchema>;
