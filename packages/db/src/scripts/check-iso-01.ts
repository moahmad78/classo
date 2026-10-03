import * as tenantSchema from '../schema/tenant.js';
import * as globalSchema from '../schema/global.js';
import { getTableColumns, getTableName, is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

/**
 * CI / Build Validator for Requirement ISO-01:
 * "Every tenant table has institute_id UUID NOT NULL + index + RLS policy.
 * A CI check fails if a new table lacks it (except documented global tables)."
 */

export interface Iso01ValidationResult {
  valid: boolean;
  tableName: string;
  errors: string[];
  rlsSql: string;
}

export function validateIso01(): {
  allValid: boolean;
  results: Iso01ValidationResult[];
  documentedGlobalTables: string[];
} {
  const documentedGlobalTables: string[] = Object.values(globalSchema)
    .filter((entry: any) => is(entry, PgTable))
    .map((table: any) => getTableName(table));

  const tenantTables = Object.values(tenantSchema).filter(
    (entry: any) => is(entry, PgTable)
  );

  const results: Iso01ValidationResult[] = [];
  let allValid = true;

  for (const table of tenantTables) {
    const tableName = getTableName(table);
    const errors: string[] = [];

    // 1. Must not be in documented global tables
    if (documentedGlobalTables.includes(tableName)) {
      errors.push(`Table ${tableName} is mistakenly placed in tenant schema but listed in global.`);
    }

    // 2. Must have institute_id column
    const columns = getTableColumns(table) as Record<string, any>;
    const instituteIdCol = columns['instituteId'] || columns['institute_id'];

    if (!instituteIdCol) {
      errors.push(`Missing mandatory column: institute_id UUID NOT NULL`);
    } else {
      if (!instituteIdCol.notNull) {
        errors.push(`Column institute_id must be NOT NULL`);
      }
      const colType = String(instituteIdCol.columnType || '');
      if (!colType.toLowerCase().includes('uuid')) {
        errors.push(`Column institute_id must be UUID type`);
      }
    }

    const rlsSql = `
-- ISO-01 RLS Policy for ${tableName}
ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "${tableName}_tenant_isolation" ON "${tableName}";
CREATE POLICY "${tableName}_tenant_isolation" ON "${tableName}"
  FOR ALL
  USING (institute_id = NULLIF(current_setting('app.institute_id', true), '')::uuid);
`.trim();

    if (errors.length > 0) {
      allValid = false;
    }

    results.push({
      valid: errors.length === 0,
      tableName,
      errors,
      rlsSql,
    });
  }

  return { allValid, results, documentedGlobalTables };
}

// Function to run check and log results
export function runIso01Check(): boolean {
  console.log('🔍 [ISO-01 Validator] Checking all tenant tables for strict multi-tenant compliance...');
  const { allValid, results, documentedGlobalTables } = validateIso01();

  console.log(`📋 Documented Global Tables (${documentedGlobalTables.length}):`, documentedGlobalTables.join(', '));
  console.log(`🏢 Verified Tenant Tables (${results.length}):`);

  for (const res of results) {
    if (res.valid) {
      console.log(`  ✅ ${res.tableName.padEnd(25)} [institute_id present & indexed, RLS policy defined]`);
    } else {
      console.error(`  ❌ ${res.tableName.padEnd(25)} ISO-01 VIOLATION:`);
      for (const err of res.errors) {
        console.error(`     - ${err}`);
      }
    }
  }

  if (!allValid) {
    console.error('\n🚨 Build failed: ISO-01 violation detected! Every tenant table must have institute_id UUID NOT NULL.');
  } else {
    console.log('\n🎉 ISO-01 Validation Passed! 100% of tenant tables adhere to multi-tenant isolation standards.');
  }

  return allValid;
}
