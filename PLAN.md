# Journal — Project Plan

A journaling app for me and a few friends: voice recordings, free-form entries, and question prompts (individual or preset groups), organized by day. Under the hood it's really a date-organized notes app — nothing in the schema enforces journal semantics (e.g. one-entry-per-day); "journal" is just how it's used.

**Local-only, never deployed.** Each person clones the repo and runs it on their own machine. No accounts, no login, no multi-tenant data, no TLS/credential storage — one journal per install, OS filesystem permissions are the security boundary.

## Stack

| Layer           | Choice                                      | Notes                                                                                                                 |
| --------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Package manager | Yarn 4 via Corepack                         | Pinned via `packageManager` field, `nodeLinker: node-modules`. No global installs.                                    |
| Frontend        | Vite + Vue 3 (Composition API) + TypeScript | vue-router; Pinia only if state outgrows composables.                                                                 |
| Server          | Hono on Node (`@hono/node-server`)          | Typed RPC via `hono/client` — route types flow to Vue with zero codegen. Validation with zod (`@hono/zod-validator`). |
| Database        | Postgres + piqued                           | Typed SQL, own workspace (`packages/db` — see below). Docker Compose for local dev.                                   |
| Auth            | None                                        | Local-only, single-user per install.                                                                                  |
| Audio           | Local filesystem                            | Behind a small `Storage` interface in case that changes; no cloud storage planned.                                    |

## Workspaces

```
packages/
  common/       @journal/common    — shared types, zod schemas, constants (no deps). Two entry points: `.` (browser-safe — client/ui-common import this) and `./node` (settings, anything touching `process`/fs — only server/db import this)
  db/           @journal/db        — piqued connection + queries + migrations (depends: common)
  ui-common/    @journal/ui-common — shared Vue components, composables (depends: common)
  server/       @journal/server    — Hono API (depends: common, db)
  client/       @journal/client    — Vite + Vue app (depends: common, ui-common, server for AppType)
```

Root: `package.json` (workspaces, `packageManager: yarn@4.x`), `.yarnrc.yml`, `tsconfig.base.json` (project references), ESLint + Prettier, `docker-compose.yml` (Postgres), `.nvmrc`. Everything is project-scoped (Yarn via Corepack, Postgres in Docker); the one exception is the piqued binary (Rust, its own install script) — pin the version in the README and only invoke it through yarn scripts.

**Why `common` has two entry points:** importing anything from a module runs that module's entire top-level code, not just the binding you asked for. `common`'s default entry (`.`) is a single barrel (`src/index.ts`) that the browser bundle (client) also imports from — so anything with an eager, `process`/fs-touching top-level side effect in that file's module graph breaks the client build, even if the client never actually uses that export. (This is exactly how `settings` broke `yarn dev` with `process is not defined` the first time — it was re-exported from the shared barrel.) The fix: node-only code lives behind a separate `./node` entry (`src/node.ts`) that only `server`/`db` ever import; client/ui-common never do, so it's never reachable from their bundle.

### `packages/db`

```
packages/db/
  upgrades/       piqued's DAG-based schema migrations ("leaves")
  src/
    client.ts     pg.Pool (via `@journal/common/node`'s settings), smartClient(), column-order cache bootstrap, upgrade()
    postgres.ts   piqued-generated — raw per-table types/specs (fixed filename, not configurable)
    tables.ts     piqued-generated — TableBuilder per table (the `[emit].tableFile` from piqued.toml)
    queries/      .sql PREPARE statements + piqued-generated .ts, 1:1 (none yet)
```

`piqued.toml` lives at the **repo root**, not inside `packages/db` (its `[workspace].root` points down at `./packages/db/src`). Full piqued reference — config, migration mechanics, query-file pragma syntax, footguns hit while setting this up — lives in `packages/db/CLAUDE.md`.

- `SmartClient` is piqued's own class (`@piqued/client`), not ours — `client.ts` just wires up a `pg.Pool` and exposes `smartClient()`. Usage pattern (matches prior piqued work): `using client = await smartClient();` at the call site — not the `withSmartClient(fn)` callback form, which is rarely used.
- Two ways to query, used deliberately: piqued-generated methods (from the whole-schema `tables.ts`) for anything ordinary (most of the app), hand-written `.sql` query files for the minority being optimized (complex joins/aggregates) — piqued still generates the typed wrapper either way.
- Migrations are piqued's own DAG upgrade system (`PiquedUpgradeControl`, not a hand-rolled runner). New ones are added via `yarn db:new <name>` (root script); applied via `yarn db:upgrade` (always goes to latest head).
- `packages/server` is the only consumer of `@journal/db`.

## Data model

```
prompt_group      id, name, description
prompt            id, group_id, position, text, archived, created_at

entry             id, entry_date (date), body, created_at
recording         id, entry_id, path, mime_type, duration_ms, size_bytes, created_at
prompt_response   id, entry_id, prompt_text, response, created_at
```

Every `prompt` belongs to exactly one `prompt_group` — there are no standalone prompts, and entries only ever gain prompts by adding a whole group (never picking one individually). Adding a group to an entry creates one `prompt_response` row per prompt in that group, **snapshotting the prompt's wording into `prompt_text`** rather than storing a `prompt_id` FK — `response = NULL` until answered, then filled in independently and asynchronously. Snapshotting (not referencing) means editing a prompt's wording later never changes past responses, and a `prompt` can always be deleted regardless of how many responses exist — there's no FK for it to violate. `entry.body` is the main journaling text, independent of any attached prompts — an entry with zero prompts attached is still fully journal-able via `body` alone. `recording` attaches directly to an entry via `entry_id` — no item-wrapper table; there's currently no path for an audio _response_ to a specific prompt (would need a future schema change if ever wanted). Single-user per install, so nothing is owner-scoped (no `users`/`sessions`/`invites`). `entry_date` is a label, not a constraint — a day can have zero, one, or several entries.

**Date/time typing** — pick deliberately per column:

- _Instant_ ("this moment happened"): `created_at` etc., server-assigned `now()`, `timestamptz`.
- _Civil/wall-clock value_ ("the day/time as experienced"): `entry_date` — client sends its local date, stored literally, no timezone math, reads back the same everywhere. Same rule for any future local time-of-day field.

## API surface (all under /api, zod-validated)

- `entries`: GET by date / list by month; POST create for date; PATCH `body`; POST add a prompt group (creates its `prompt_response` rows); DELETE
- `prompt-responses`: PATCH `response` by `id`
- `prompts`: CRUD; `prompt-groups`: CRUD + membership
- `recordings`: POST upload (multipart, attaches directly to an entry), GET stream (Range support), DELETE

Client consumes `hono/client` with the server's exported `AppType` — end-to-end types from SQL (piqued) → API (hono) → Vue.

## Voice recording flow

Browser `MediaRecorder` (webm/opus) → multipart upload → server writes file via `Storage` interface, inserts a `recording` row with `entry_id` set directly. Playback via `<audio>` against a streaming endpoint (manual Range-request handler, ~30 lines).

## Phases

1. **Scaffold** (done) — workspaces, tsconfigs, ESLint/Prettier, Docker Compose Postgres, hello-world Hono + Vite/Vue, typed RPC proven end-to-end.
2. **DB core** — scaffold `packages/db` (client.ts, queries/, upgrades/), initial schema via piqued upgrades. (`settings` in `packages/common` already landed ahead of this phase.)
3. **Journal core** — day entries, free-text items, day navigation, edit/reorder/delete.
4. **Questions** — question bank CRUD, preset groups, "add question/group to today" flow.
5. **Voice** — record/upload/playback, recording UI in ui-common.
6. **Polish** — error handling, packaging/docs so a friend can clone and run it locally.

## Decisions log

- Timezone: client sends its local date (see Date/time typing above).
- Past entries are freely editable.
- Schema simplified from an earlier polymorphic `entry_item` (`kind: 'text' | 'audio' | 'question'` + CHECK constraints) to three flat, purpose-specific relationships: `entry.body` (main journaling), `recording.entry_id` (direct attach), `prompt_response` (entry + a frozen prompt snapshot, nullable `response`). Renamed `question`/`question_group` → `prompt`/`prompt_group` to match. A prompt belongs to exactly one group (no standalone prompts, no many-to-many); entries only ever gain prompts by adding a whole group at once.
- Snapshot, not reference: `prompt_response` stores `prompt_text` (copied at attach-time) instead of a `prompt_id` FK. Editing a prompt's wording later doesn't retroactively change past responses, and a `prompt` can always be deleted — nothing FK-references it, so there's no "can't delete, it's in use" case to design around.
- Audio _responses_ to individual prompts: not supported by the current schema at all (no `recording_id` on `prompt_response`) — would need a future migration if ever wanted. Standalone audio (`recording` attached directly to an entry) is still planned for Phase 5.
- Packaging: single setup script, not a multi-step README.
- Config: a single typed `settings` object in `packages/common` — one zod schema describing the whole config shape, parsed from `process.env` once at import time. This is the only way app config gets read (no ad-hoc `process.env` accessors elsewhere). Chosen over both the imperative `Env`/`Settings` accessor-function style from prior work (scattered call sites, no single source of truth for what's configurable, errors surface late) and the YAML-backed `Settings` layer (no per-environment config needed for a local-only single instance). Zod's `.transform()`/coercion covers what `marshal()` was for, so there's one validation idiom in the codebase (zod) instead of two.

## Open questions

- Exact shape of the setup script — proposal: `scripts/setup.mjs`, hand-rolled like `scripts/dev.mjs`. Steps: `corepack enable` → `yarn install` → `docker compose up -d` → wait for Postgres healthcheck → run piqued's `upgrade()`. Friend runs it once, then just `yarn dev`. Confirm once `packages/db` exists to script against.
