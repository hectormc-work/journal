# Journal — Project Plan

A journaling app for me and a few friends. Voice recordings, free-form entries, and question-driven prompts (individual questions or preset groups) organized by day.

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Package manager | Yarn 4 via Corepack | Pinned per-project with `packageManager` field. `nodeLinker: node-modules`. No global installs. |
| Frontend | Vite + Vue 3 (Composition API) + TypeScript | vue-router; Pinia only if state outgrows composables. |
| Server | Hono on Node (`@hono/node-server`) | Typed RPC via `hono/client` — route types flow to the Vue client with zero codegen. Validation with zod (`@hono/zod-validator`). |
| Database | Postgres + piqued | Raw SQL `PREPARE` queries compiled to typed TS clients (`@piqued/client`). Docker Compose for local dev. |
| Auth | Session cookies + Postgres session store | argon2 password hashing, httpOnly/SameSite cookies, invite-only signup. |
| Audio | Server filesystem | Behind a small `Storage` interface so S3 is a later swap, not a rewrite. |

## Monorepo layout

```
packages/
  common/       @journal/common    — shared types, zod schemas, constants (no deps on other pkgs)
  ui-common/    @journal/ui-common — shared Vue components, composables (depends: common)
  client/       @journal/client    — Vite + Vue app (depends: common, ui-common, server for AppType)
  server/       @journal/server    — Hono API (depends: common)
```

Root: `package.json` (workspaces: `packages/*`, `packageManager: yarn@4.x`), `.yarnrc.yml`, shared `tsconfig.base.json` with project references, ESLint + Prettier, `docker-compose.yml` (Postgres), `.nvmrc`.

Everything project-scoped: Yarn via Corepack, deps in workspaces, Postgres in Docker. The one exception is the piqued binary (Rust, installed via its install script); pin its version in the README and wrap invocations in yarn scripts so day-to-day use never touches it directly.

## Data model

```
users              id, email, name, password_hash, created_at
sessions           id (token), user_id, expires_at, created_at
invites            code, created_by, used_by, expires_at

questions          id, user_id (owner), prompt, archived, created_at
question_groups    id, user_id, name, description
question_group_items  group_id, question_id, position

entries            id, user_id, entry_date (date, unique per user), created_at
entry_items        id, entry_id, position, kind ('text' | 'audio' | 'question')
                   body (text — for text/question answers)
                   question_id (nullable, for kind='question')
                   recording_id (nullable, for kind='audio')

recordings         id, user_id, path, mime_type, duration_ms, size_bytes, created_at
```

One entry per user per day; an entry is an ordered list of items. Adding a preset group to a day expands into one question-item per question. A question item can also carry an audio answer later if wanted (add `recording_id` use for kind='question').

Migrations: numbered `.sql` files in `packages/server/migrations/` with a ~30-line runner using `pg` (piqued wants plain SQL anyway; no migration framework needed).

## API surface (all under /api, zod-validated)

- `auth`: POST signup (invite code required), login, logout; GET me
- `entries`: GET by date / list by month; POST create for date; item CRUD (add text/question/audio item, edit body, reorder, delete)
- `questions`: CRUD; `groups`: CRUD + membership
- `recordings`: POST upload (multipart), GET stream (with Range support), DELETE

Client consumes `hono/client` with the server's exported `AppType` — end-to-end types from SQL (piqued) → API (hono) → Vue.

## Voice recording flow

Browser `MediaRecorder` (webm/opus) → multipart upload → server writes file via `Storage` interface, inserts `recordings` row → entry item references it. Playback via `<audio>` against the streaming endpoint (manual Range-request handler, ~30 lines).

## Phases

1. **Scaffold** — Corepack + Yarn 4 workspaces, tsconfigs, ESLint/Prettier, Docker Compose Postgres, hello-world Hono server + Vite Vue client, typed RPC proven end-to-end.
2. **DB + auth** — migration runner, initial schema, piqued setup, invite-only signup/login/logout, session middleware, login UI.
3. **Journal core** — day entries, free-text items, day navigation (calendar/date picker), edit/reorder/delete.
4. **Questions** — question bank CRUD, preset groups, "add question / add group to today" flow.
5. **Voice** — record/upload/playback, recording UI in ui-common.
6. **Polish** — invites UI, error handling, deploy story (single VPS: node + postgres + caddy, or fly.io).

## Open questions (decide as we hit them)

- Timezone for "what day is it" — client-supplied date vs server clock (lean: client sends its local date).
- Can past days be edited? (lean: yes, it's your journal)
- Audio answers to questions in v1 or later?
- Invite mechanism: codes vs email links (lean: codes — no email infra).
