---
name: piqued-upgrade
description: Create and apply a piqued DB migration (schema change to packages/db/upgrades), then regenerate typed query files. Use whenever a task needs a new/changed table.
---

## Steps

Order matters, especially steps 4 and 5.

1. `yarn db:new <name>` (root script), not the raw `piqued-migrate new` CLI directly. Creates `packages/db/upgrades/<name>#<hash>/`. Never pre-create that directory yourself, even empty: breaks with "No roots found in upgrade graph".
2. Write plain DDL in the generated `upgrade.sql` / `downgrade.sql`. No pragma syntax here, that's for hand-written query files (`.claude/rules/piqued-sql.md`).
3. `yarn db:up` if Postgres isn't already running.
4. `yarn db:upgrade`: applies every pending migration, always to the latest head. No reason to pass `--version` in the normal case.
5. `piqued --config piqued.toml` (repo root): regenerates `packages/db/src/{postgres,tables}.ts`. Must come after step 4, codegen introspects the live schema, so running it first gets stale/wrong types.
6. Commit the migration dir and the two regenerated files together (both are checked in, no build step in this repo).

## Mechanics and gotchas

The DAG structure and why the CLI can be finicky.

- DAG-based, not sequential numbering. Hash is derived from the migration name plus current graph heads (via `PiquedUpgradeControl`).
- `root#000000` is the empty common-ancestor every graph starts from.
- Applying migrations isn't a `piqued-migrate` CLI subcommand in this setup. It's programmatic: `PiquedUpgradeControl.fromDir(...).upgradeToVersion(...)`, wrapped by `packages/db/src/client.ts`'s `upgrade()`, driven by `scripts/db-upgrade.ts`.
- `execFileSync("piqued-migrate", ...)` fails `ENOENT` outside Yarn's bin resolution. A plain `tsx script.ts` doesn't get `node_modules/.bin` injection the way `yarn <script>` does, and even `yarn exec` fails from repo root since `@piqued/client` is `packages/db`'s dependency, not root's. If ever invoking the CLI directly (normally not needed, `yarn db:new`/`yarn db:upgrade` cover it): `yarn workspace @journal/db exec piqued-migrate <args...>`.
- Full reference (config, query-builder syntax, everything else piqued): `packages/db/CLAUDE.md`.
