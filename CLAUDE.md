# CLAUDE.md

Journal — a personal journaling app for Anahí and a few friends. Voice recordings, free-form entries, and question prompts (individual or preset groups) organized by day. Full architecture, data model, and roadmap in [PLAN.md](./PLAN.md) — read it before making structural changes.

## Working with Anahí

- She is a full-stack developer. Explain tradeoffs in prose and let her decide; don't just pick.
- Show diffs / proposed changes before applying them. No silent edits.
- Never hand-edit the live DB (raw `ALTER TABLE`/etc. via psql or similar) to fix a schema mistake, even on an empty table. Migration files are the source of truth, always use the `piqued-downgrade` skill instead
- Prefer hand-rolled solutions over adding packages. Every new dependency needs explicit sign-off (see scripts/dev.mjs — written by hand instead of using concurrently, deliberately).
- Prefer newest versions when possible (TS 6, Vite 8 were deliberate choices).
- All tooling is project-scoped: Yarn via Corepack (`packageManager` field), Postgres via Docker. Never install anything globally.

## Stack

- Yarn 4 workspaces (Corepack-pinned), node-modules linker
- `packages/common` — shared zod schemas/types (zod 4); no internal deps. Two entry points: `.` (`src/index.ts`, browser-safe) and `./node` (`src/node.ts`, node-only — currently just `settings`). See Config below for why the split exists
- `packages/db` — @journal/db, piqued connection + query layer; depends on common (imports `settings` via `@journal/common/node`). Full piqued reference (config, migration mechanics, gotchas) lives in `packages/db/CLAUDE.md` — read it before touching migrations or query files
- `packages/ui-common` — shared Vue components; depends on common (`.` entry only)
- `packages/server` — Hono on Node (`@hono/node-server`), exports `AppType` from `src/app.ts` for typed RPC; depends on common (imports `settings` via `@journal/common/node`), db. Conventions + Hono type-inference gotchas: `packages/server/CLAUDE.md`
- `packages/client` — Vite 8 + Vue 3.5 (Composition API, `<script setup lang="ts">`), vue-router 5, `hc<AppType>` client wrapped by `src/api.ts`. Conventions (component-per-file, the `api.ts` pattern): `packages/client/CLAUDE.md`
- Internal packages export TS source directly (no build step; Vite/tsx consume it raw). Usually a single `"exports": "./src/index.ts"` — `common` is the one exception, with two entries (see above)
- Postgres 17 (Docker), piqued (Rust binary pinned 0.7.12, `@piqued/client` npm) for typed SQL, lives in `packages/db`. `piqued.toml` (codegen config) lives at the **repo root**, not inside `packages/db`
- Migrations: piqued's own DAG-based upgrade system (`PiquedUpgradeControl`, `packages/db/upgrades/`), not a hand-rolled runner or sequential numbering. Create with `yarn db:new <name>`, apply with `yarn db:upgrade` — full workflow + gotchas in the `piqued-upgrade` skill
- Codegen: `piqued --config piqued.toml` (repo root) regenerates `packages/db/src/{postgres,tables}.ts` from the live schema — **must run after migrating**, never before. Query-writing conventions: `.claude/rules/piqued-sql.md` (hand-written `.sql` files) / `piqued-orm.md` (query builder)
- TypeScript ^6.0 everywhere; if vue-tsc throws compiler-internal errors in .vue files, suspect the TS 6 pairing (rollback path in README)

## Conventions

- Routes stay chained off one Hono expression, `AppType` inference depends on it. Per-domain routers in `server/src/routers/`, composed into `app.ts` via chained `.route()` calls: `packages/server/CLAUDE.md`
- Validation schemas (zod) live server-side, colocated with the domain logic that uses them (e.g. `packages/server/src/db/entries.ts`), applied via `@hono/zod-validator` — **not** in `common`. Same for output types: no hand-duplicated `Entry`-style type in `common` either; both ends get the wire shape via structural inference (piqued server-side, `hono/client`'s `InferResponseType` client-side). See `packages/server/CLAUDE.md` / `packages/client/CLAUDE.md`
- Each workspace declares every dep it uses (including typescript) — no relying on hoisting for peer resolution
- Git: Graphite (`gt`) stacked-PR workflow — create branches with `gt create`, not raw `git checkout -b`
- Commands: `yarn dev` (both servers), `yarn typecheck` (all workspaces), `yarn lint`/`lint:fix`, `yarn format`/`format:check`, `yarn db:up`/`db:down`, `yarn build`
- Lint/format: root-level `eslint.config.mjs` (flat config, typescript-eslint + eslint-plugin-vue) and `.prettierrc.json` (defaults — existing code already matched them)
- Config: one zod schema (`packages/common/src/settings.ts`) describes the whole app config shape (`server.port`, `db.{host,port,user,password,database}`), parsed from `process.env` once at import time into a typed `settings` object — the only way config gets read anywhere (no ad-hoc `process.env` access, no imperative per-key accessor functions). Extend the schema in that one file as new config is needed. **Import it via `@journal/common/node`, never the default `@journal/common` entry** — the default entry is the one the browser bundle (client) also imports from, and its top-level `process.env` read broke `yarn dev` (`process is not defined` in the browser) the first time it was re-exported from the shared barrel. `src/node.ts` is the general home for anything node-only in `common`, not just settings

## Status (update as phases complete)

- Phase 1 (scaffold) done: workspaces, typed RPC round-trip, Docker Postgres, dev runner, ESLint + Prettier
- Phase 2 (DB core) done: `packages/db` scaffolded and verified end-to-end — schema live, migrations applied, piqued codegen run, `SmartClient` query tested against the real DB
- Phase 3 (Journal core) done: entries CRUD (`packages/server/src/db/entries.ts` + `app.ts` routes) wired end-to-end to a master-detail client UI (sidebar + 50/50 split, see PLAN.md's Client UI section and `packages/client/CLAUDE.md`). No query `.sql` files written yet — entries CRUD is simple enough for piqued's query-builder directly (see `packages/db/CLAUDE.md`'s "two ways to query")
- Data model: `prompt_group` / `prompt` (a prompt belongs to exactly one group — no standalone prompts) / `entry` (`name` NOT NULL — defaults to the formatted date if not given; `body` is the always-present main journaling text) / `recording` (attaches directly via `entry_id`) / `prompt_response` (`entry_id` + a frozen `prompt_text` snapshot + nullable `response` — no `prompt_id` FK) — see PLAN.md's Data model section for the full picture and rationale
- Resolved: entries are one-per-day (`entry_date` `UNIQUE`, added once task/bucket-list linking needed it unambiguous — `POST /entries` on a taken date just returns the existing entry); no polymorphic entry-item table (replaced by `entry.body` + `recording.entry_id` + `prompt_response`, see PLAN.md Decisions log); `prompt_response` snapshots the prompt's wording rather than referencing it, so editing/deleting a `prompt` never touches past responses; local-only, no auth/sessions/invites — see PLAN.md
