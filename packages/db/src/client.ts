import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

export interface DatabaseConfig {
  connectionString?: string;
  max?: number;
  idleTimeoutMillis?: number;
}

let pool: pg.Pool | null = null;

export function getPool(config?: DatabaseConfig): pg.Pool {
  if (!pool) {
    const connectionString =
      config?.connectionString ||
      process.env.DATABASE_URL ||
      'postgresql://classo_app:classo_secure_pass@localhost:5432/classo_db';

    pool = new pg.Pool({
      connectionString,
      max: config?.max || 20,
      idleTimeoutMillis: config?.idleTimeoutMillis || 30000,
    });
  }
  return pool;
}

export function createDrizzleClient(clientOrPool: pg.Pool | pg.PoolClient) {
  return drizzle(clientOrPool, { schema });
}

/**
 * Execute a unit of work strictly inside a tenant-scoped transaction.
 * PRD 4.2 Multi-Tenancy Model:
 * "On every request, backend middleware sets SET LOCAL app.institute_id = '<uuid>'
 * inside the transaction. RLS is enforced at DB level."
 */
export async function withTenantContext<T>(
  instituteId: string,
  fn: (db: ReturnType<typeof createDrizzleClient>, client: pg.PoolClient) => Promise<T>,
  existingPool?: pg.Pool
): Promise<T> {
  const p = existingPool || getPool();
  const client = await p.connect();

  try {
    await client.query('BEGIN');
    // Set tenant session variable local to this transaction
    await client.query(`SET LOCAL app.institute_id = '${instituteId.replace(/'/g, "''")}'`);

    const tenantDb = createDrizzleClient(client);
    const result = await fn(tenantDb, client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Control Center Context
 * PRD 4.2: "Control Center uses a separate DB role with explicit, audited cross-tenant access."
 */
export async function withControlCenterContext<T>(
  fn: (db: ReturnType<typeof createDrizzleClient>, client: pg.PoolClient) => Promise<T>,
  existingPool?: pg.Pool
): Promise<T> {
  const p = existingPool || getPool();
  const client = await p.connect();

  try {
    const db = createDrizzleClient(client);
    return await fn(db, client);
  } finally {
    client.release();
  }
}
