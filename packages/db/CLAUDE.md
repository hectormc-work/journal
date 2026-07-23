# packages/db — piqued notes

Everything learned about piqued while scaffolding this package, so it doesn't need
re-discovering later. Two separate things share the name:

- **`piqued`** — the Rust binary. Does `.sql` → `.ts` codegen (introspects a live
  Postgres DB) and runs a language server. Installed via curl script, **not** via
  npm (see Setup below).
- **`@piqued/client`** (npm, this package's dependency) — pure runtime: the
  `SmartClient`/`PiquedUpgradeControl` classes, plus two bins,
  `piqued-migrate`/`pqm`, for creating and applying migrations. No Rust binary
  needed for anything migration-related — only for codegen.

## Setup (for a fresh machine / the eventual project setup script)

Order matters — codegen needs the DB schema to already be live and current:

1. Install the `piqued` Rust binary — **the one step that can't be scripted
   headlessly**: the install script writes to `/usr/local/bin` and needs an
   interactive `sudo` password prompt.
   ```
   curl https://raw.githubusercontent.com/zwade/piqued/refs/heads/master/rust/piqued/scripts/install.sh | bash
   ```
   The script always fetches the latest GitHub release — there's no version-pin
   flag. We just record the observed version in the root README for reference.
2. `yarn install` — gets `@piqued/client`, `pg`, etc. (no sudo needed, this half
   is a normal npm dependency).
3. `yarn db:up` — Postgres via Docker Compose.
4. `yarn db:upgrade` — applies every pending migration (see below). Always goes
   to the latest/head; there's normally no reason to pass `--version`.
5. `piqued --config piqued.toml` (run from repo root) — introspects the live
   schema and generates `packages/db/src/postgres.ts` (raw per-table
   types/specs, always this filename — not configurable via `tableFile`) and
   `packages/db/src/tables.ts` (the `[emit].tableFile`, `TableBuilder`
   instances per table, built from `postgres.ts`). Must come _after_ step 4,
   since it introspects the live schema.
6. Only after step 5 do the generated `.ts` files exist — `packages/db` (and
   anything importing its generated types) won't typecheck before that. Both
   generated files are committed (no build step in this repo, per CLAUDE.md
   convention) and excluded from Prettier/ESLint — reformatting them is
   pointless since codegen overwrites them with its own style anyway.

## Migrations — DAG-based, not sequential numbering

Each migration is a directory named `<name>#<hash>` under `packages/db/upgrades/`,
containing `upgrade.sql`, `downgrade.sql`, and `migration.toml` (`version`,
`isolatedTx`, `parents: [...]` — the DAG edges). No manual numbering — the hash
suffix is derived from the name plus the current graph heads, so it's always
unique. `root#000000` is the empty common-ancestor migration every graph starts
from.

- **Bootstrapping a fresh graph**: `piqued-migrate init <dir>` — creates
  `<dir>/root#000000`. Don't pre-create `<dir>` yourself (even empty) — an
  existing-but-empty directory makes `init`/`new` fail with "No roots found in
  upgrade graph". Let the tool create it.
- **New migration**: `yarn db:new <name>` (root script → `scripts/db-new.ts`).
  **Gotcha**: the underlying `piqued-migrate new <directory> <newUpgrade>` does
  NOT combine its two args — `<directory>` is only read to find the current
  graph heads (for `parents`); `<newUpgrade>` is the _literal_ path
  (cwd-relative or absolute) where `<newUpgrade>#<hash>` gets created, with no
  relationship to `<directory>` at all. Passing just a bare name as
  `<newUpgrade>` creates the migration next to wherever `piqued-migrate` was
  invoked from, **not** inside the upgrades dir. Our wrapper builds the full
  absolute target path itself (`packages/db/upgrades/<name>`) to avoid this.
- **Applying migrations**: not a `piqued-migrate` CLI subcommand in our setup —
  done programmatically via `PiquedUpgradeControl.fromDir(upgradesDir)` +
  `upgradeControl.upgradeToVersion(client, version, { preventDowngrade })`,
  wrapped by `client.ts`'s `upgrade()` export and driven by `yarn db:upgrade`
  (root script → `scripts/db-upgrade.ts`, using `node:util`'s `parseArgs` for
  optional `--version`/`--allowDowngrade`/`-d`). Omit `--version` to go to the
  latest head — that's the normal case.

## Bin resolution footgun

`execFileSync("piqued-migrate", ...)` fails with `ENOENT` — a plain
`tsx script.ts` invocation doesn't get Yarn's `node_modules/.bin` PATH
injection the way `yarn exec`/`yarn <script>` do. Even `yarn exec piqued-migrate`
fails from the repo root, because Yarn's bin resolution is scoped to whichever
package actually declares the dependency — `@piqued/client` belongs to
`packages/db`, not root. The working invocation is:

```
yarn workspace @journal/db exec piqued-migrate <args...>
```

## `piqued.toml` (repo root, not inside `packages/db`)

```toml
[postgres]
uri = "postgres://journal:journal@localhost:5432/journal"

[workspace]
root = "./packages/db/src"

[emit]
moduleType = "ESM"
tableFile = "tables.ts"
```

- `[postgres].uri` — connection used to introspect the live schema for codegen.
  Must point at `localhost` here (host-mapped Docker port), not a Docker-network
  service hostname.
- `[workspace].root` — directory piqued scans for query `.sql` files and where
  it emits generated `.ts` output (relative to `piqued.toml`'s own location —
  which is the repo root, hence `./packages/db/src` rather than `./src`).
- `[emit].tableFile` — the `TableBuilder`-wrapped file (`tables.ts`). The raw
  per-table namespace file `buildColumnOrderCache` actually wants is always
  named `postgres.ts` regardless of this setting.

## Query files — `.sql` with named `PREPARE` statements

Plain `--` comments are just documentation (ignored by codegen). `@`-prefixed
pragma comments configure codegen:

- `-- @params name1 name2 ...` — declares the canonical ordered parameter list.
  `:name` and positional `$N` (matching this declared order) are interchangeable
  within the same file — you can reference the same parameter either way.
- `-- @xtemplate name (default-sql-expr)` — a **compile-time textual
  substitution**, not a real bound parameter, with a default value. For places
  SQL can't bind a parameter directly: `IN (...)` lists, `ASC`/`DESC` in
  `ORDER BY`, etc.
- `PREPARE <name> AS ... ;` — the real statement; `<name>` becomes the
  generated function's name.

Example (from prior work, kept verbatim as reference for the pragma syntax):

```sql
-- @params practice_uid assigned_person_uid any_person query filter_by_class limit offset include_scheduled responsible_person_uid
-- @xtemplate statuses ('IN_PROGRESS')
-- @xtemplate class_uids (uuid_nil())
-- @xtemplate direction ASC
-- This can be used either as the global queue for a practice or for a specific staff member.
PREPARE get_outreach_queue AS
    SELECT * FROM outreach
    WHERE outreach.practice_uid = :practice_uid
        AND ($2::uuid IS NULL AND outreach.assigned_staff_uid IS NULL
             OR outreach.assigned_staff_uid = :assigned_person_uid)
        AND outreach.status IN :statuses
    ORDER BY outreach.last_action_at :direction
    LIMIT :limit OFFSET :offset;
```

Two ways to query, used deliberately: piqued-generated methods (from the
tableFile / simple `.sql` files) for anything ordinary — most of the app; hand
-written, more deliberate `.sql` (using the pragma syntax above) for the
minority of queries being actively optimized (complex joins/aggregates).

## Runtime pattern (`src/client.ts`, exported via `src/index.ts`)

- `pg.Pool`, configured from `settings.db.*` (`@journal/common/node`).
- `buildColumnOrderCache(tables, pool)` once at module load, against the
  generated `postgres.ts` namespace (imported as `tables` in `client.ts`).
  **Gotcha**: this makes importing `@journal/db` connect to Postgres
  immediately, as a side effect of the import itself — before any of the
  importer's own code runs. A static top-level `import` races anything that
  needs to check/wait for Postgres availability first (bit `scripts/setup.ts`
  when its own wait-for-Postgres loop got raced by this). If sequencing
  matters, `await import("@journal/db")` dynamically, after confirming
  readiness some other way (e.g. `pg_isready` — not `@journal/db` itself,
  chicken-and-egg).
- `smartClient()` — checks a connection out of the pool, wraps it as
  `new SmartClient(client)`. Primary usage is `using client = await smartClient();`
  at the call site (explicit resource management auto-disposes it) — not the
  `withSmartClient(fn)` callback form, which prior work rarely used.
- `upgrade(version?, { allowDowngrade? })` — see Migrations above.
- `src/index.ts` is the package's actual public entry (`"exports": "./src/index.ts"`)
  — re-exports `smartClient`/`upgrade` from `client.ts`, the per-table
  `TableBuilder`s from `tables.ts` (`EntryTable`, `PromptTable`, etc. — not
  `PiquedHeadTable`, that's piqued's own internal migration-tracking table),
  and the query-builder primitives below, re-exported from `@piqued/client` so
  `packages/server` only ever needs to depend on `@journal/db`, never reach
  past it to `@piqued/client` directly.

## Query-builder syntax (`Select`/`Insert`/`Update`/`Delete`/`Op`)

For ordinary CRUD (no hand-written `.sql` query file needed) — build queries
directly against a table's generated `TableBuilder`. **Always requires an
explicit `SmartClient`** passed to `.one()`/`.opt()`/`.many()`/`.execute()` —
unlike generated per-query-file wrappers (from `.sql` files bound to a pool via
a factory, prior work's pattern — not used yet in this repo), the raw
query-builder has no implicit pool fallback.

```ts
import {
  Delete,
  EntryTable,
  Insert,
  Op,
  Select,
  smartClient,
  Update,
} from "@journal/db";

// SELECT — TableBuilder.star spreads every column; TableBuilder.c.<col> for one column
using client = await smartClient();

const allEntries = await Select(...EntryTable.star)
  .from(EntryTable)
  .orderBy(EntryTable.c.created_at, "desc")
  .many(client);

const oneEntry = await Select(...EntryTable.star)
  .from(EntryTable)
  .where(Op.eq(EntryTable.c.id, id))
  .opt(client); // opt() = zero-or-one; one() throws if missing; many() = array

// INSERT — .values() takes a plain object; .returning(...cols) shapes the result
const created = await Insert(EntryTable)
  .values({ entry_date: date, body })
  .returning(...EntryTable.star)
  .one(client);

// UPDATE — .set() + .where(); .whereEq({...}) is a shorthand for equality-only conditions
const updated = await Update(EntryTable)
  .set({ body })
  .where(Op.eq(EntryTable.c.id, id))
  .returning(...EntryTable.star)
  .one(client);

// DELETE
await Delete(EntryTable).where(Op.eq(EntryTable.c.id, id)).execute(client);
```

`Op` covers `eq`/`lt`/`lte`/`gt`/`gte`/`is`/`isNot`/`in_`/`not`/`and`/`or`/
`isNull`/`isNotNull`/`coalesce`/`count`/`min`/`max`/`arrayAgg`/`concat` — no
`between`, compose range checks with `Op.and(Op.gte(...), Op.lt(...))`.
Multiple chained `.where(...)` calls on a `Select` AND together, same as one
`Op.and(...)`.

## Server-side consumption pattern

`packages/server` is the only consumer — see `packages/server/CLAUDE.md` for
the routes-vs-data-access layout and the Hono type-inference gotchas hit while
wiring entries CRUD through it.
