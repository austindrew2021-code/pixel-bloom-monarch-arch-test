import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { isMigrationFile, migrationName, pendingMigrations } from "./migration-plan.mjs";
import { projectRoot } from "./with-app-env.mjs";

const AUTH_MIGRATION = "0001_auth.sql";

/**
 * The auth-on copy of the Better Auth schema and its source, or null when the
 * app has not turned sign-in on (the shipped state).
 */
function authSchemaCopy(root) {
  const copy = join(root, "migrations", AUTH_MIGRATION);
  const source = join(root, "migrations/auth", AUTH_MIGRATION);
  if (!existsSync(copy) || !existsSync(source)) return null;
  return { copy: readFileSync(copy, "utf8"), source: readFileSync(source, "utf8") };
}

test("_migrations keys on basename, not path", () => {
  assert.equal(migrationName("/migrations/0002_todos.sql"), "0002_todos.sql");
  assert.equal(migrationName("migrations/auth/0001_auth.sql"), "0001_auth.sql");
  assert.equal(migrationName("0001_auth.sql"), "0001_auth.sql");
});

test("a file already applied from another directory does not re-apply", () => {
  // The auth-on path copies migrations/auth/0001_auth.sql into the globbed
  // directory; a database that already has it must not run it twice.
  assert.deepEqual(pendingMigrations(["/migrations/0001_auth.sql"], ["0001_auth.sql"]), []);
});

test("pending migrations are returned in name order", () => {
  assert.deepEqual(
    pendingMigrations(
      ["/migrations/0003_c.sql", "/migrations/0001_a.sql", "/migrations/0002_b.sql"],
      ["0001_a.sql"],
    ),
    [
      { name: "0002_b.sql", path: "/migrations/0002_b.sql" },
      { name: "0003_c.sql", path: "/migrations/0003_c.sql" },
    ],
  );
});

test("non-.sql entries are dropped (readdir also yields the auth/ directory)", () => {
  assert.equal(isMigrationFile("auth"), false);
  assert.deepEqual(pendingMigrations(["auth", "README.md"], []), []);
});

test("the auth schema ships outside the globbed directory", () => {
  const migrationsDir = join(projectRoot(), "migrations");
  // The app's own schema lives in the globbed directory and is expected to be
  // pending on a fresh database. What must NOT be there is the auth schema:
  // it stays under migrations/auth/ until an app deliberately turns sign-in on,
  // and neither applier descends into that folder.
  const pending = pendingMigrations(readdirSync(migrationsDir), []).map((m) => m.name);
  assert.equal(
    pending.includes(AUTH_MIGRATION),
    existsSync(join(migrationsDir, AUTH_MIGRATION)),
    "0001_auth.sql is only ever pending once it has been copied up on purpose",
  );
  assert.ok(readdirSync(join(migrationsDir, "auth")).includes(AUTH_MIGRATION));
});

test("the app schema applies once and creates what the server queries", () => {
  const sql = readFileSync(join(projectRoot(), "migrations/0002_app.sql"), "utf8");
  // Every table src/lib/community.ts and the billing rail read from.
  for (const table of [
    "profiles",
    "follows",
    "notification_prefs",
    "community_recipes",
    "notifications",
    "conversations",
    "conversation_members",
    "messages",
    "checkout_sessions",
    "entitlements",
    "plate_ledger",
    "billing_events",
  ]) {
    assert.match(sql, new RegExp(`create table if not exists ${table}\\b`), table);
  }
  // Re-running a migration must be harmless: the applier records it by name,
  // but a hand re-run during a recovery should not blow up either.
  assert.equal(/create table (?!if not exists)/i.test(sql), false, "every table needs IF NOT EXISTS");
  assert.equal(/create index (?!if not exists)/i.test(sql), false, "every index needs IF NOT EXISTS");
});

test("this workspace's auth schema copy is byte-identical to its source", () => {
  // An edited copy diverges silently: basename keying skips it on a database
  // that already ran the original, and applies it on a fresh PGLite preview.
  const pair = authSchemaCopy(projectRoot());
  if (pair === null) return; // sign-in off — nothing has been copied up
  assert.equal(
    pair.copy,
    pair.source,
    "migrations/0001_auth.sql has been edited — it must stay a verbatim copy of migrations/auth/0001_auth.sql",
  );
});

test("the copy check reads both files and catches an edit", () => {
  const root = mkdtempSync(join(tmpdir(), "auth-schema-"));
  mkdirSync(join(root, "migrations/auth"), { recursive: true });
  writeFileSync(join(root, "migrations/auth", AUTH_MIGRATION), "create table t ();\n");
  assert.equal(authSchemaCopy(root), null);

  writeFileSync(join(root, "migrations", AUTH_MIGRATION), "create table t ();\n");
  const same = authSchemaCopy(root);
  assert.equal(same.copy, same.source);

  writeFileSync(join(root, "migrations", AUTH_MIGRATION), "create table t (x int);\n");
  const drifted = authSchemaCopy(root);
  assert.notEqual(drifted.copy, drifted.source);
});
