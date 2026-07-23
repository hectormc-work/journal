# Journal

Personal journaling app — voice recordings, free-form entries, and question prompts. See [PLAN.md](./PLAN.md) for architecture and roadmap.

## Prerequisites

- Node ≥ 22.12 (`.nvmrc` says 24) — Yarn comes via Corepack, nothing global to install
- Docker (for Postgres)
- piqued binary, pinned at **0.7.12**:
  `curl https://raw.githubusercontent.com/zwade/piqued/refs/heads/master/rust/piqued/scripts/install.sh | bash`
  (writes to `/usr/local/bin`, needs an interactive `sudo` password — run it yourself, it can't be scripted headlessly)

## Setup

```sh
corepack enable      # once per machine; reads yarn version from package.json
yarn install
yarn db:up           # Postgres 17 in Docker
yarn db:upgrade      # apply schema migrations (packages/db/upgrades)
piqued --config piqued.toml   # generate typed query/table files — see packages/db/CLAUDE.md
yarn dev             # server on :3000, client on :5173 (proxies /api)
```

## Workspaces

| Package              | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `@journal/common`    | Shared zod schemas + types. Depends on nothing internal.             |
| `@journal/db`        | Piqued connection, queries, migrations. See `packages/db/CLAUDE.md`. |
| `@journal/ui-common` | Shared Vue components/composables.                                   |
| `@journal/client`    | Vite + Vue 3 app. Consumes the server's `AppType` for typed RPC.     |
| `@journal/server`    | Hono API on Node. Exports `AppType` from `src/app.ts`.               |

Internal packages export TypeScript source directly (no build step) — Vite and tsx consume `.ts` from workspace deps as-is.

## Scripts

- `yarn dev` — hand-rolled runner (`scripts/dev.ts`) spawns both dev servers, prefixed output, dies together
- `yarn typecheck` — `tsc`/`vue-tsc --noEmit` across all workspaces
- `yarn lint` / `yarn lint:fix` — ESLint across the repo
- `yarn format` / `yarn format:check` — Prettier across the repo
- `yarn build` — type-check + production build of the client
- `yarn db:up` / `yarn db:down` — Postgres container
- `yarn db:new <name>` / `yarn db:upgrade` — create / apply piqued migrations (see `packages/db/CLAUDE.md`)
- `yarn kill` — frees the dev ports (3000, 5173) if a stale process survives an unclean `yarn dev` shutdown ("port already in use" on next run)

## Config

Copy `.env.example` to `.env` and adjust as needed. All app config is read through a single typed `settings` object (`packages/common/src/settings.ts`) — a zod schema parsed from `process.env` once at startup, so a missing or malformed value fails fast with a clear error instead of surfacing later inside some request handler.

## Known risk

TypeScript is pinned to the brand-new 6.0 major. If `vue-tsc` throws compiler-internal errors in `.vue` files, downgrade root `typescript` to `^5.9.3` and re-run `yarn install`.
