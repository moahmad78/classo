import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

describe('ISO-02: Strict Multi-Tenant Data Isolation Test Suite', () => {
  let pg: PGlite;

  const tenantAId = '11111111-1111-1111-1111-111111111111';
  const tenantBId = '22222222-2222-2222-2222-222222222222';

  const userAId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const userBId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeAll(async () => {
    pg = new PGlite();

    // 1. Initialize schema in PostgreSQL
    await pg.exec(`
      CREATE TABLE institutes (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(64) NOT NULL UNIQUE,
        code VARCHAR(32) NOT NULL UNIQUE
      );

      CREATE TABLE users (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        email VARCHAR(255),
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL
      );

      CREATE TABLE departments (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        name VARCHAR(255) NOT NULL
      );

      -- Enable RLS (ISO-01)
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

      -- Create Tenant Isolation Policies (PRD 4.2)
      CREATE POLICY users_tenant_isolation ON users
        FOR ALL
        USING (institute_id = NULLIF(current_setting('app.institute_id', true), '')::uuid)
        WITH CHECK (institute_id = NULLIF(current_setting('app.institute_id', true), '')::uuid);

      CREATE POLICY departments_tenant_isolation ON departments
        FOR ALL
        USING (institute_id = NULLIF(current_setting('app.institute_id', true), '')::uuid)
        WITH CHECK (institute_id = NULLIF(current_setting('app.institute_id', true), '')::uuid);

      -- Create non-superuser application role with NOBYPASSRLS (PRD 4.2)
      CREATE ROLE classo_app_user WITH LOGIN;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO classo_app_user;
      ALTER ROLE classo_app_user NOBYPASSRLS;
    `);

    // 2. Seed Tenant A and Tenant B
    await pg.exec(`
      INSERT INTO institutes (id, name, subdomain, code) VALUES
        ('${tenantAId}', 'Delhi Public School', 'dps', 'DPS001'),
        ('${tenantBId}', 'St. Xavier College', 'stxavier', 'STX001');
    `);
  });

  afterAll(async () => {
    await pg.close();
  });

  it('Scenario 1: Tenant A context can only view Tenant A records', async () => {
    // Seed records for both tenants under superuser
    await pg.exec(`
      INSERT INTO users (id, institute_id, email, full_name, role) VALUES
        ('${userAId}', '${tenantAId}', 'principal@dps.edu', 'Principal Sharma', 'admin'),
        ('${userBId}', '${tenantBId}', 'director@stxavier.edu', 'Director George', 'admin');
    `);

    // Run query inside transaction with Tenant A context
    await pg.exec('BEGIN;');
    await pg.exec(`SET LOCAL ROLE classo_app_user;`);
    await pg.exec(`SET LOCAL app.institute_id = '${tenantAId}';`);

    const result = await pg.query<{ id: string; full_name: string }>('SELECT id, full_name FROM users;');
    await pg.exec('COMMIT;');

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].id).toBe(userAId);
    expect(result.rows[0].full_name).toBe('Principal Sharma');
  });

  it('Scenario 2: Tenant B context can only view Tenant B records', async () => {
    await pg.exec('BEGIN;');
    await pg.exec(`SET LOCAL ROLE classo_app_user;`);
    await pg.exec(`SET LOCAL app.institute_id = '${tenantBId}';`);

    const result = await pg.query<{ id: string; full_name: string }>('SELECT id, full_name FROM users;');
    await pg.exec('COMMIT;');

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].id).toBe(userBId);
    expect(result.rows[0].full_name).toBe('Director George');
  });

  it('Scenario 3: Tenant A cannot read Tenant B record by direct ID guessing', async () => {
    await pg.exec('BEGIN;');
    await pg.exec(`SET LOCAL ROLE classo_app_user;`);
    await pg.exec(`SET LOCAL app.institute_id = '${tenantAId}';`);

    // Tenant A queries specifically for Tenant B's user ID
    const result = await pg.query(`SELECT * FROM users WHERE id = '${userBId}';`);
    await pg.exec('COMMIT;');

    // Must return 0 rows
    expect(result.rows.length).toBe(0);
  });

  it('Scenario 4: Tenant A cannot update Tenant B records', async () => {
    await pg.exec('BEGIN;');
    await pg.exec(`SET LOCAL ROLE classo_app_user;`);
    await pg.exec(`SET LOCAL app.institute_id = '${tenantAId}';`);

    // Tenant A tries to change Tenant B user's name
    const updateResult = await pg.query(
      `UPDATE users SET full_name = 'Hacked Name' WHERE id = '${userBId}';`
    );
    await pg.exec('COMMIT;');

    expect(updateResult.affectedRows).toBe(0);

    // Verify Tenant B user is untouched
    await pg.exec('BEGIN;');
    await pg.exec(`SET LOCAL ROLE classo_app_user;`);
    await pg.exec(`SET LOCAL app.institute_id = '${tenantBId}';`);

    const verify = await pg.query<{ full_name: string }>(`SELECT full_name FROM users WHERE id = '${userBId}';`);
    await pg.exec('COMMIT;');

    expect(verify.rows[0].full_name).toBe('Director George');
  });

  it('Scenario 5: Tenant A cannot delete Tenant B records', async () => {
    await pg.exec('BEGIN;');
    await pg.exec(`SET LOCAL ROLE classo_app_user;`);
    await pg.exec(`SET LOCAL app.institute_id = '${tenantAId}';`);

    const deleteResult = await pg.query(`DELETE FROM users WHERE id = '${userBId}';`);
    await pg.exec('COMMIT;');

    expect(deleteResult.affectedRows).toBe(0);
  });

  it('Scenario 6: Tenant A cannot insert a record spoofing Tenant B institute_id', async () => {
    await pg.exec('BEGIN;');
    await pg.exec(`SET LOCAL ROLE classo_app_user;`);
    await pg.exec(`SET LOCAL app.institute_id = '${tenantAId}';`);

    const spoofedUserId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

    // Trying to insert with Tenant B's ID while in Tenant A session should violate WITH CHECK RLS policy
    let insertFailed = false;
    try {
      await pg.query(`
        INSERT INTO users (id, institute_id, email, full_name, role)
        VALUES ('${spoofedUserId}', '${tenantBId}', 'spoofed@stxavier.edu', 'Spoofed User', 'teacher');
      `);
    } catch {
      insertFailed = true;
    } finally {
      await pg.exec('ROLLBACK;');
    }

    expect(insertFailed).toBe(true);
  });

  it('Scenario 7: Queries with no active tenant context return 0 records', async () => {
    await pg.exec('BEGIN;');
    await pg.exec(`SET LOCAL ROLE classo_app_user;`);
    // app.institute_id is NOT set

    const result = await pg.query('SELECT * FROM users;');
    await pg.exec('COMMIT;');

    expect(result.rows.length).toBe(0);
  });
});
