import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const migrationName = /^(\d{4})_[a-z0-9_]+\.sql$/;

export async function discoverMigrations(root = process.cwd()) {
  const directory = join(root, 'drizzle');
  const entries = await readdir(directory, { withFileTypes: true });
  const migrations = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.sql'))
    .map(entry => {
      const match = migrationName.exec(entry.name);
      if (!match) throw new Error(`Invalid migration filename: ${entry.name}. Expected NNNN_name.sql.`);
      return { name: entry.name, order: Number(match[1]) };
    })
    .sort((left, right) => left.order - right.order);

  if (!migrations.length) throw new Error(`No migrations found in ${directory}.`);
  for (let index = 0; index < migrations.length; index += 1) {
    const migration = migrations[index];
    if (migration.order !== index) {
      const expected = String(index).padStart(4, '0');
      throw new Error(`Migration ordering is invalid: expected ${expected}_*.sql, found ${migration.name}.`);
    }
    if (index && migrations[index - 1].order === migration.order) {
      throw new Error(`Duplicate migration order ${String(migration.order).padStart(4, '0')}.`);
    }
  }

  return Promise.all(migrations.map(async migration => {
    const sql = await readFile(join(directory, migration.name), 'utf8');
    if (!sql.trim()) throw new Error(`Migration ${migration.name} is empty.`);
    return { ...migration, sql };
  }));
}

export function migrationStatements(sql) {
  return sql.split('--> statement-breakpoint').map(value => value.trim()).filter(Boolean);
}

export function expectedMigrationTables(migrations) {
  const tables = new Set();
  const pattern = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([a-zA-Z0-9_]+)["`]?/gi;
  for (const migration of migrations) {
    for (const match of migration.sql.matchAll(pattern)) tables.add(match[1]);
  }
  return [...tables].sort();
}

export async function applyMigrations(db, migrations) {
  for (const migration of migrations) {
    for (const statement of migrationStatements(migration.sql)) await db.prepare(statement).run();
  }
}

export async function verifyMigrationSchema(db, migrations) {
  const expected = expectedMigrationTables(migrations);
  const actual = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const names = new Set(actual.results.map(row => String(row.name)));
  const missing = expected.filter(name => !names.has(name));
  if (missing.length) throw new Error(`Application schema mismatch. Missing tables: ${missing.join(', ')}.`);
  for (const required of ['user', 'session', 'contractor_workspaces', 'contractor_memberships', 'command_records', 'trial_applications']) {
    if (!names.has(required)) throw new Error(`Required table is unavailable after migrations: ${required}.`);
  }
  return { migrationCount: migrations.length, latest: migrations.at(-1)?.name, tableCount: expected.length };
}
