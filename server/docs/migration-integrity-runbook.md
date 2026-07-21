# Migration integrity runbook

This gate proves that the committed Prisma migration history can build the current managed schema on a fresh database. It preserves the explicitly allowlisted raw PostGIS objects and rejects any other residual drift.

## Prerequisites

- Run commands from the `server` directory with the project's Node.js dependencies installed.
- Set `DATABASE_URL` in the process environment. Do not put credentials in command arguments, examples, CI logs, or this document.
- The PostgreSQL account must be allowed to connect to the `postgres` maintenance database and have `CREATE DATABASE` privilege.
- Migrations require the privileges needed to create and use the PostGIS and `pg_trgm` extensions and their objects.
- The host must permit temporary databases whose names begin with `didaugio_codex_migration_`.

The reconciliation SQL avoids PostgreSQL catalog columns introduced after PostgreSQL 12. Static compatibility guards cover PostgreSQL 12-14, but release CI should run a real PostgreSQL 12-14 version matrix when those runtimes are available; a single local PostgreSQL runtime is not proof of the entire matrix.

## Local and CI quality gate

Run the complete gate:

```powershell
npm run quality:migrations
```

The aggregate command first runs `npm run migrate:verify`, so a missing `DATABASE_URL` fails immediately instead of turning the live reconciliation checks into a successful skip. It then runs exactly these focused files:

```powershell
node --test test/migrationAudit.test.js test/migrationHistory.contract.test.js test/migrationReconciliation.integration.test.js
```

The verifier generates an unpredictable name under the safe prefix, creates that isolated database, runs `prisma migrate deploy` and the drift comparison against it, then removes only that invocation-owned database. Cleanup is attempted after deploy, diff, or assertion failures once this invocation's `CREATE DATABASE` has succeeded. A failed create (including a name collision) never claims ownership and therefore never drops another job's database. There is no debug-retention mode.

The verifier passes database credentials only through child-process environment variables. It never emits an unredacted database URL or credential; a safe failure diagnostic may contain URL metadata only after both user-info and query-string passwords are replaced with `***`. The verifier never deploys or resets the application database; only the prefix-validated temporary database can be created or dropped. Cleanup is PostgreSQL 12-compatible: it disables new connections for the exact identifier, terminates sessions selected with a parameterized database name, and then executes a plain `DROP DATABASE` from the `postgres` maintenance database.

Gate success proves that the current invocation removed its owned database. Do not use a global count of prefix-matching databases as a CI correctness assertion: other parallel jobs may legitimately own databases at the same time.

For a separate local orphan audit, run this read-only listing only when no migration gates are active:

```sql
SELECT datname
FROM pg_database
WHERE datname LIKE 'didaugio_codex_migration_%'
ORDER BY datname;
```

Any rows are candidates for operator investigation, not automatic deletion. If cleanup itself fails, the gate reports both the primary failure and the cleanup failure. An operator must resolve that exceptional infrastructure failure using the exact prefix-validated name from PostgreSQL administration records; never run a wildcard drop command.

## Application database preflight

To inspect migration state without applying migrations, run:

```powershell
npx.cmd prisma migrate status --schema=prisma/schema.prisma
```

`prisma migrate status` is read-only for schema objects: use it to identify pending, divergent, or failed history. Do not substitute `migrate deploy`, `migrate dev`, `db push`, or `migrate reset` during a preflight.

## Production deployment boundary

This gate authorizes verification only. A production deployment requires all of the following outside this workflow:

1. A tested, current database backup and a documented restore procedure.
2. Review of pending migration SQL and expected lock/data-backfill impact.
3. Explicit approval from the responsible production operator.
4. A separately authorized `prisma migrate deploy` execution and post-deploy checks.

Never run `prisma migrate reset` or `prisma db push` against production.
