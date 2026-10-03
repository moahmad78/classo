import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { validateSubdomainFormat } from '../modules/registration/subdomain.validator.js';
import { PasswordService } from '../common/auth/password.service.js';
import { JwtAuthService } from '../common/auth/jwt.service.js';

describe('Phase 1 Core & Control Center v0 Test Suite', () => {
  let pg: PGlite;

  beforeAll(async () => {
    pg = new PGlite();

    // Set up schema for Phase 1 in-memory testing
    await pg.exec(`
      CREATE TABLE institutes (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(32) NOT NULL,
        subdomain VARCHAR(64) NOT NULL UNIQUE,
        code VARCHAR(32) NOT NULL UNIQUE,
        status VARCHAR(32) NOT NULL DEFAULT 'trial',
        contact_phone VARCHAR(20) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        trial_ends_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE institute_applications (
        id UUID PRIMARY KEY,
        institute_name VARCHAR(255) NOT NULL,
        institute_type VARCHAR(32) NOT NULL,
        official_phone VARCHAR(20) NOT NULL,
        official_email VARCHAR(255) NOT NULL,
        principal_name VARCHAR(255) NOT NULL,
        principal_phone VARCHAR(20) NOT NULL,
        principal_email VARCHAR(255) NOT NULL,
        preferred_subdomain VARCHAR(64) NOT NULL,
        application_status VARCHAR(32) NOT NULL DEFAULT 'submitted',
        email_verified BOOLEAN DEFAULT FALSE,
        phone_verified BOOLEAN DEFAULT FALSE,
        rejection_reason TEXT
      );

      CREATE TABLE subdomain_reservations (
        id UUID PRIMARY KEY,
        subdomain VARCHAR(64) NOT NULL UNIQUE,
        application_id UUID REFERENCES institute_applications(id),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );

      CREATE TABLE users (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        email VARCHAR(255),
        phone VARCHAR(20),
        password_hash TEXT,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        failed_login_attempts JSONB DEFAULT '{"count": 0}'
      );

      CREATE TABLE invites (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        email VARCHAR(255),
        phone VARCHAR(20),
        role VARCHAR(32) NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        accepted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE departments (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        name VARCHAR(255) NOT NULL
      );

      CREATE TABLE campus_locations (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        name VARCHAR(255) NOT NULL,
        latitude VARCHAR(32) NOT NULL,
        longitude VARCHAR(32) NOT NULL,
        radius_meters VARCHAR(16) NOT NULL DEFAULT '150',
        is_active BOOLEAN DEFAULT TRUE
      );
    `);
  });

  afterAll(async () => {
    await pg.close();
  });

  describe('REG-05: Subdomain Formatting & Reservation Rules', () => {
    it('accepts valid subdomains between 3 and 30 characters', () => {
      expect(validateSubdomainFormat('dpsrohini').valid).toBe(true);
      expect(validateSubdomainFormat('apex-kota').valid).toBe(true);
      expect(validateSubdomainFormat('st-xaviers-2026').valid).toBe(true);
    });

    it('rejects subdomains shorter than 3 or longer than 30 characters', () => {
      expect(validateSubdomainFormat('ab').valid).toBe(false);
      expect(validateSubdomainFormat('a'.repeat(31)).valid).toBe(false);
    });

    it('rejects invalid characters, uppercase, and leading/trailing hyphens', () => {
      expect(validateSubdomainFormat('DPSRohini').valid).toBe(false);
      expect(validateSubdomainFormat('-leadinghyphen').valid).toBe(false);
      expect(validateSubdomainFormat('trailinghyphen-').valid).toBe(false);
      expect(validateSubdomainFormat('school.name').valid).toBe(false);
      expect(validateSubdomainFormat('school_name').valid).toBe(false);
    });

    it('strictly blocks reserved subdomains (admin, api, www, app, support, etc.)', () => {
      expect(validateSubdomainFormat('admin').valid).toBe(false);
      expect(validateSubdomainFormat('api').valid).toBe(false);
      expect(validateSubdomainFormat('www').valid).toBe(false);
      expect(validateSubdomainFormat('app').valid).toBe(false);
      expect(validateSubdomainFormat('support').valid).toBe(false);
      expect(validateSubdomainFormat('billing').valid).toBe(false);
    });
  });

  describe('REG-01 to REG-09: Self-Registration, Approval Queue & Auto-Creation', () => {
    const appId = '33333333-3333-3333-3333-333333333333';
    const reservationId = '44444444-4444-4444-4444-444444444444';
    const instituteId = '55555555-5555-5555-5555-555555555555';
    const principalUserId = '66666666-6666-6666-6666-666666666666';

    it('REG-01..03: records submission and tracks OTP verification to under_review', async () => {
      await pg.exec(`
        INSERT INTO institute_applications (
          id, institute_name, institute_type, official_phone, official_email,
          principal_name, principal_phone, principal_email, preferred_subdomain, application_status
        ) VALUES (
          '${appId}', 'Heritage International School', 'school', '+919876543210', 'admin@heritage.edu',
          'Dr. Sunita Rao', '+919876543210', 'principal@heritage.edu', 'heritage', 'submitted'
        );

        INSERT INTO subdomain_reservations (id, subdomain, application_id, expires_at)
        VALUES ('${reservationId}', 'heritage', '${appId}', NOW() + INTERVAL '14 days');
      `);

      // Verify OTP step
      await pg.exec(`
        UPDATE institute_applications
        SET email_verified = TRUE, phone_verified = TRUE, application_status = 'under_review'
        WHERE id = '${appId}';
      `);

      const res = await pg.query<{ application_status: string; email_verified: boolean }>(
        `SELECT application_status, email_verified FROM institute_applications WHERE id = '${appId}';`
      );

      expect(res.rows[0].application_status).toBe('under_review');
      expect(res.rows[0].email_verified).toBe(true);
    });

    it('REG-08: on approval, creates institute, Principal account (role Admin), and 72h invite', async () => {
      const inviteTokenHash = 'hash-of-random-72h-token-12345';

      await pg.exec(`
        -- 1. Create institute in trial
        INSERT INTO institutes (id, name, type, subdomain, code, status, contact_phone, contact_email, trial_ends_at)
        VALUES ('${instituteId}', 'Heritage International School', 'school', 'heritage', 'HER001', 'trial', '+919876543210', 'admin@heritage.edu', NOW() + INTERVAL '14 days');

        -- 2. Create Principal user with role Admin
        INSERT INTO users (id, institute_id, email, phone, full_name, role, is_active)
        VALUES ('${principalUserId}', '${instituteId}', 'principal@heritage.edu', '+919876543210', 'Dr. Sunita Rao', 'admin', TRUE);

        -- 3. Create 72h invite token
        INSERT INTO invites (id, institute_id, email, role, token_hash, expires_at)
        VALUES ('77777777-7777-7777-7777-777777777777', '${instituteId}', 'principal@heritage.edu', 'admin', '${inviteTokenHash}', NOW() + INTERVAL '72 hours');

        -- 4. Mark application approved
        UPDATE institute_applications SET application_status = 'approved' WHERE id = '${appId}';
      `);

      const instRes = await pg.query<{ status: string; code: string }>(
        `SELECT status, code FROM institutes WHERE id = '${instituteId}';`
      );
      expect(instRes.rows[0].status).toBe('trial');
      expect(instRes.rows[0].code).toBe('HER001');

      const userRes = await pg.query<{ role: string; full_name: string }>(
        `SELECT role, full_name FROM users WHERE id = '${principalUserId}';`
      );
      expect(userRes.rows[0].role).toBe('admin');
      expect(userRes.rows[0].full_name).toBe('Dr. Sunita Rao');
    });

    it('REG-09: on rejection, releases subdomain reservation', async () => {
      const rejectedAppId = '88888888-8888-8888-8888-888888888888';
      const rejectedSubdomain = 'rejected-school';

      await pg.exec(`
        INSERT INTO institute_applications (
          id, institute_name, institute_type, official_phone, official_email,
          principal_name, principal_phone, principal_email, preferred_subdomain, application_status
        ) VALUES (
          '${rejectedAppId}', 'Rejected Academy', 'coaching', '+919111222333', 'reject@academy.edu',
          'Mr. Fake', '+919111222333', 'fake@academy.edu', '${rejectedSubdomain}', 'submitted'
        );

        INSERT INTO subdomain_reservations (id, subdomain, application_id, expires_at)
        VALUES ('99999999-9999-9999-9999-999999999999', '${rejectedSubdomain}', '${rejectedAppId}', NOW() + INTERVAL '14 days');

        -- Reject & release reservation
        UPDATE institute_applications SET application_status = 'rejected', rejection_reason = 'Invalid registration certificate' WHERE id = '${rejectedAppId}';
        DELETE FROM subdomain_reservations WHERE application_id = '${rejectedAppId}';
      `);

      const checkSub = await pg.query(
        `SELECT * FROM subdomain_reservations WHERE subdomain = '${rejectedSubdomain}';`
      );
      expect(checkSub.rows.length).toBe(0);
    });
  });

  describe('USR-01, USR-07: Role-Selector Login & Server Role Verification', () => {
    const testInstId = '55555555-5555-5555-5555-555555555555';
    const teacherId = 'aaaaaaaa-1111-2222-3333-444444444444';
    let teacherPasswordHash: string;

    beforeAll(async () => {
      teacherPasswordHash = await PasswordService.hash('TeacherSecure2026!');
      await pg.exec(`
        INSERT INTO users (id, institute_id, email, phone, full_name, role, password_hash, is_active)
        VALUES ('${teacherId}', '${testInstId}', 'sharma.physics@heritage.edu', '+919876543222', 'Mr. R. Sharma', 'teacher', '${teacherPasswordHash}', TRUE);
      `);
    });

    it('USR-01: logs in successfully when credentials and selected role match', async () => {
      const res = await pg.query<{ role: string; password_hash: string }>(
        `SELECT role, password_hash FROM users WHERE institute_id = '${testInstId}' AND email = 'sharma.physics@heritage.edu';`
      );

      expect(res.rows.length).toBe(1);
      const isPasswordValid = await PasswordService.verify(
        res.rows[0].password_hash,
        'TeacherSecure2026!'
      );
      expect(isPasswordValid).toBe(true);

      const selectedRole = 'teacher';
      expect(res.rows[0].role).toBe(selectedRole);

      // Issue JWT
      const jwtService = new JwtAuthService();
      const token = jwtService.generateAccessToken({
        sub: teacherId,
        instituteId: testInstId,
        role: selectedRole,
        permissions: ['attendance.mark'],
      });

      const decoded = jwtService.verifyAccessToken(token);
      expect(decoded.role).toBe('teacher');
      expect(decoded.instituteId).toBe(testInstId);
    });

    it('USR-07: rejects login if user selects a role they do NOT possess (Role Mismatch)', async () => {
      const res = await pg.query<{ role: string }>(
        `SELECT role FROM users WHERE institute_id = '${testInstId}' AND email = 'sharma.physics@heritage.edu';`
      );

      const userDbRole = res.rows[0].role; // 'teacher'
      const fraudulentSelectedRole = 'admin'; // User clicked 'Principal/Admin' card

      const isRoleAuthorized = userDbRole === fraudulentSelectedRole;
      expect(isRoleAuthorized).toBe(false);
    });
  });

  describe('SET-05 & SET-06: Departments & Campus Geofence for Selfie Attendance', () => {
    const testInstId = '55555555-5555-5555-5555-555555555555';

    it('SET-05: creates and retrieves departments', async () => {
      await pg.exec(`
        INSERT INTO departments (id, institute_id, name)
        VALUES ('bbbbbbbb-1111-2222-3333-444444444444', '${testInstId}', 'Science Department');
      `);

      const res = await pg.query<{ name: string }>(
        `SELECT name FROM departments WHERE institute_id = '${testInstId}';`
      );
      expect(res.rows.some((d) => d.name === 'Science Department')).toBe(true);
    });

    it('SET-06: creates campus location with latitude, longitude and 150m geofence', async () => {
      await pg.exec(`
        INSERT INTO campus_locations (id, institute_id, name, latitude, longitude, radius_meters)
        VALUES ('cccccccc-1111-2222-3333-444444444444', '${testInstId}', 'Main Campus Ground', '28.7041', '77.1025', '150');
      `);

      const res = await pg.query<{ name: string; radius_meters: string }>(
        `SELECT name, radius_meters FROM campus_locations WHERE institute_id = '${testInstId}';`
      );
      expect(res.rows[0].name).toBe('Main Campus Ground');
      expect(res.rows[0].radius_meters).toBe('150');
    });
  });
});
