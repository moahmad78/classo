import { institutes, plans, users, departments, academicYears } from '../schema/index.js';
import { createDrizzleClient, getPool } from '../client.js';
import { PasswordService } from '../../../apps/api/src/common/auth/password.service.js';

/**
 * PRD Section 18 Rule 9:
 * "Seed data: provide a seeding script creating 3 demo institutes
 * (one school, one college, one coaching) with realistic Indian names/data for demos and tests."
 */
export async function seedDemoTenants() {
  const pool = getPool();
  const db = createDrizzleClient(pool);

  console.log('🌱 Seeding demo plans & 3 multi-tenant institutes...');

  // 1. Seed Plans
  const [proPlan] = await db
    .insert(plans)
    .values({
      name: 'Pro Institute',
      monthlyPricePaise: 499900, // ₹4,999 / month
      annualPricePaise: 4999900, // ₹49,999 / year
      maxStudents: 1500,
      maxStaff: 100,
      storageGb: 50,
      monthlyMessageCredits: 10000,
      features: ['attendance', 'fees', 'salary', 'homework', 'exams', 'selfie_attendance'],
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  const defaultPasswordHash = await PasswordService.hash('ClassoDemo2026!');

  // 2. Demo Institute 1: School (Delhi Public School, Rohini)
  const [school] = await db
    .insert(institutes)
    .values({
      name: 'Delhi Public School, Rohini',
      type: 'school',
      subdomain: 'dpsrohini',
      code: 'DPS001',
      status: 'active',
      contactPhone: '+919811002233',
      contactEmail: 'contact@dpsrohini.in',
      city: 'New Delhi',
      state: 'Delhi',
      pinCode: '110085',
      address: 'Sector 24, Phase III, Rohini',
      brandingColors: {
        primary: '#0F766E',
        accent: '#F59E0B',
      },
    })
    .onConflictDoNothing()
    .returning();

  if (school) {
    // Departments
    await db.insert(departments).values([
      { instituteId: school.id, name: 'Primary Wing' },
      { instituteId: school.id, name: 'Secondary Wing' },
      { instituteId: school.id, name: 'Senior Secondary Wing' },
      { instituteId: school.id, name: 'Administration' },
    ]);

    // Academic Year
    await db.insert(academicYears).values({
      instituteId: school.id,
      name: '2026-2027',
      startDate: new Date('2026-04-01T00:00:00Z'),
      endDate: new Date('2027-03-31T23:59:59Z'),
      isCurrent: true,
    });

    // Principal User
    await db.insert(users).values({
      instituteId: school.id,
      fullName: 'Dr. Anita Sharma',
      email: 'principal@dpsrohini.in',
      phone: '+919811002233',
      role: 'admin',
      passwordHash: defaultPasswordHash,
      isActive: true,
    });
    console.log('  ✅ Seeded School: Delhi Public School, Rohini (dpsrohini.classo.in)');
  }

  // 3. Demo Institute 2: College (St. Xavier's College of Engineering & Technology)
  const [college] = await db
    .insert(institutes)
    .values({
      name: "St. Xavier's College of Engineering & Technology",
      type: 'college',
      subdomain: 'stxavier',
      code: 'STX001',
      status: 'active',
      contactPhone: '+919845011223',
      contactEmail: 'admissions@stxavier.edu.in',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560001',
      address: 'Residency Road, Richmond Town',
      brandingColors: {
        primary: '#1E3A8A', // Deep Navy
        accent: '#EA580C', // Terracotta
      },
    })
    .onConflictDoNothing()
    .returning();

  if (college) {
    // Departments
    await db.insert(departments).values([
      { instituteId: college.id, name: 'Computer Science & Engineering' },
      { instituteId: college.id, name: 'Electronics & Communication' },
      { instituteId: college.id, name: 'Mechanical Engineering' },
      { instituteId: college.id, name: 'Applied Sciences' },
    ]);

    await db.insert(academicYears).values({
      instituteId: college.id,
      name: '2026-2027',
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: new Date('2027-07-31T23:59:59Z'),
      isCurrent: true,
    });

    await db.insert(users).values({
      instituteId: college.id,
      fullName: 'Dr. Joseph George',
      email: 'director@stxavier.edu.in',
      phone: '+919845011223',
      role: 'admin',
      passwordHash: defaultPasswordHash,
      isActive: true,
    });
    console.log("  ✅ Seeded College: St. Xavier's College (stxavier.classo.in)");
  }

  // 4. Demo Institute 3: Coaching (Apex IIT-JEE & NEET Academy)
  const [coaching] = await db
    .insert(institutes)
    .values({
      name: 'Apex IIT-JEE & NEET Academy',
      type: 'coaching',
      subdomain: 'apexkota',
      code: 'APX001',
      status: 'active',
      contactPhone: '+919414099887',
      contactEmail: 'info@apexkota.com',
      city: 'Kota',
      state: 'Rajasthan',
      pinCode: '324005',
      address: 'Plot 12, Vigyan Nagar',
      brandingColors: {
        primary: '#0F766E',
        accent: '#F59E0B',
      },
    })
    .onConflictDoNothing()
    .returning();

  if (coaching) {
    await db.insert(departments).values([
      { instituteId: coaching.id, name: 'Physics Department' },
      { instituteId: coaching.id, name: 'Chemistry Department' },
      { instituteId: coaching.id, name: 'Mathematics Department' },
      { instituteId: coaching.id, name: 'Biology Department' },
    ]);

    await db.insert(academicYears).values({
      instituteId: coaching.id,
      name: '2026-2027 (Target JEE/NEET)',
      startDate: new Date('2026-05-01T00:00:00Z'),
      endDate: new Date('2027-04-30T23:59:59Z'),
      isCurrent: true,
    });

    await db.insert(users).values({
      instituteId: coaching.id,
      fullName: 'Er. Rajesh K. Agrawal',
      email: 'director@apexkota.com',
      phone: '+919414099887',
      role: 'admin',
      passwordHash: defaultPasswordHash,
      isActive: true,
    });
    console.log('  ✅ Seeded Coaching: Apex Academy (apexkota.classo.in)');
  }

  console.log('🎉 3 Demo Institutes Seeded Successfully with default password: ClassoDemo2026!');
}
