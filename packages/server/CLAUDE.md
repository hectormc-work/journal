# packages/server — Hono on Node

Typed RPC backend. Exports `AppType` from `src/app.ts`, consumed by the client's `hc<AppType>`.

## Layout

- `src/db/<domain>.ts` — data access + zod validation schemas
- `src/routers/<domain>.ts` — that domain's routes
- `src/app.ts` — composes every router into one chained instance

How to write within this layout: `.claude/rules/hono-routes.md`.
