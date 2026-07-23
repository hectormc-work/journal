# CLAUDE.md

Journal — a personal journaling app for Anahí and a few friends. Voice recordings, free-form entries, and question prompts organized by day. Architecture, data model, roadmap: [PLAN.md](./PLAN.md).

## Stack

- Yarn 4 workspaces, node-modules linker. No build step, packages export TS source directly
- `packages/common` — shared zod schemas/types, no internal deps
- `packages/db` — piqued query layer over Postgres 17 (Docker): `packages/db/CLAUDE.md`. Never hand-edit the live DB, use the `piqued-downgrade` skill instead
- `packages/ui-common` — shared Vue components
- `packages/server` — Hono RPC backend: `packages/server/CLAUDE.md`
- `packages/client` — Vite + Vue client: `packages/client/CLAUDE.md`
- TypeScript 6 everywhere (vue-tsc issues: rollback path in README)

## Commands

`yarn dev`, `yarn typecheck`, `yarn lint`/`lint:fix`, `yarn format`/`format:check`, `yarn db:up`/`db:down`, `yarn build`

## Conventions

- Git: Graphite (`gt`) stacked-PR workflow, `gt create` not raw `git checkout -b`
- Every workspace declares its own deps, no relying on hoisting
- Config/settings conventions: `.claude/rules/settings-import.md`

## Status (update as phases complete)

- Phases 1-3 done: scaffold, DB core, entries CRUD end-to-end with a master-detail client UI
- Data model, resolved decisions, rationale: PLAN.md
