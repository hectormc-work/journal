# packages/db — piqued

`@journal/db`: piqued connection + query layer. Depends on `common` (`settings` via `@journal/common/node`). Only consumer: `packages/server`.

Two things share the name "piqued":

- **`piqued`** the Rust binary — `.sql` → `.ts` codegen, language server. Installed via curl script, not npm
- **`@piqued/client`** (npm) — the runtime: `SmartClient`/`PiquedUpgradeControl`, `piqued-migrate`/`pqm` bins. No Rust binary needed except for codegen

## Setup, fresh machine

Order matters, codegen needs the schema already live:

1. Install the piqued binary (interactive `sudo`, can't script headlessly): `curl https://raw.githubusercontent.com/zwade/piqued/refs/heads/master/rust/piqued/scripts/install.sh | bash` — always latest release, no version pin, observed version in root README
2. `yarn install`
3. `yarn db:up` (Postgres via Docker)
4. `yarn db:upgrade` (applies pending migrations to latest head)
5. `piqued --config piqued.toml` (repo root) — generates `packages/db/src/{postgres,tables}.ts`. Must run after step 4
6. Both generated files are committed, excluded from Prettier/ESLint (codegen owns their formatting)

## Migrations — DAG, not sequential numbering

`packages/db/upgrades/<name>#<hash>/` (`upgrade.sql`, `downgrade.sql`, `migration.toml` with `parents: [...]`). `root#000000` is the common ancestor. Full workflow: `piqued-upgrade` / `piqued-downgrade` skills.

## `piqued.toml` (repo root, not inside this package)

```toml
[postgres]
uri = "postgres://journal:journal@localhost:5432/journal"

[workspace]
root = "./packages/db/src"

[emit]
moduleType = "ESM"
tableFile = "tables.ts"
```

- `uri` must be `localhost` (host-mapped Docker port), not a Docker-network hostname
- `root` is relative to repo root, not this package
- `tableFile` names the `TableBuilder` file; the raw per-table file is always `postgres.ts`

## Two ways to query

- Query-builder off a table's `TableBuilder`, for anything ordinary: `.claude/rules/piqued-orm.md`
- Hand-written `.sql` with pragma comments, for queries being actively optimized: `.claude/rules/piqued-sql.md`

## Runtime (`src/client.ts`, exported via `src/index.ts`)

- `pg.Pool` from `settings.db.*`; `smartClient()` → `using client = await smartClient();`
- `upgrade(version?, { allowDowngrade? })`, see Migrations above
- `src/index.ts` re-exports `smartClient`/`upgrade`, per-table `TableBuilder`s, and query-builder primitives, so `packages/server` never reaches past `@journal/db`

Importing this package connects to Postgres immediately (`buildColumnOrderCache` at module load) — workaround: `.claude/rules/piqued-orm.md`.
