import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import {
  institutes,
  academicYears,
  departments,
  campusLocations,
  users,
  getPool,
  createDrizzleClient,
} from '@classo/db';
import { CreateDepartmentInput, CreateCampusLocationInput } from './setup.dto.js';

@Injectable()
export class SetupService {
  private getDb() {
    return createDrizzleClient(getPool());
  }

  /**
   * PRD SET-01: Get Setup Wizard Progress
   */
  async getWizardStatus(instituteId: string) {
    const db = this.getDb();

    const [institute] = await db
      .select()
      .from(institutes)
      .where(eq(institutes.id, instituteId))
      .limit(1);

    if (!institute) {
      throw new NotFoundException({ code: 'INSTITUTE_NOT_FOUND', message: 'Institute not found.' });
    }

    const currentYears = await db
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(eq(academicYears.instituteId, instituteId))
      .limit(1);

    const instDepts = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.instituteId, instituteId));

    const staffUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.instituteId, instituteId), eq(users.role, 'teacher')));

    const locations = await db
      .select({ id: campusLocations.id })
      .from(campusLocations)
      .where(eq(campusLocations.instituteId, instituteId));

    const steps = {
      profileConfirmed: true,
      academicYearSet: currentYears.length > 0,
      departmentsCreated: instDepts.length > 0,
      staffInvited: staffUsers.length > 0,
      campusGeofenceSet: locations.length > 0,
    };

    const completedCount = Object.values(steps).filter(Boolean).length;
    const progressPercent = Math.round((completedCount / Object.keys(steps).length) * 100);

    return {
      institute: {
        id: institute.id,
        name: institute.name,
        type: institute.type,
        subdomain: institute.subdomain,
        code: institute.code,
      },
      steps,
      progressPercent,
      isWizardComplete: progressPercent >= 80,
    };
  }

  /**
   * PRD SET-05: Create / Add Department
   */
  async createDepartment(instituteId: string, input: CreateDepartmentInput) {
    const db = this.getDb();
    const [dept] = await db
      .insert(departments)
      .values({
        instituteId,
        name: input.name,
        description: input.description,
        headOfDepartmentId: input.headOfDepartmentId,
      })
      .returning();

    return dept;
  }

  /**
   * PRD SET-05: List Departments
   */
  async listDepartments(instituteId: string) {
    const db = this.getDb();
    return db
      .select()
      .from(departments)
      .where(eq(departments.instituteId, instituteId));
  }

  /**
   * PRD SET-06: Create Campus Location Geofence for staff selfie attendance
   */
  async createCampusLocation(instituteId: string, input: CreateCampusLocationInput) {
    const db = this.getDb();
    const [location] = await db
      .insert(campusLocations)
      .values({
        instituteId,
        name: input.name,
        latitude: input.latitude,
        longitude: input.longitude,
        radiusMeters: input.radiusMeters,
        isActive: true,
      })
      .returning();

    return location;
  }

  /**
   * PRD SET-06: List Campus Locations
   */
  async listCampusLocations(instituteId: string) {
    const db = this.getDb();
    return db
      .select()
      .from(campusLocations)
      .where(eq(campusLocations.instituteId, instituteId));
  }
}
