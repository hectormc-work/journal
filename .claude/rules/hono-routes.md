---
paths:
  - "packages/server/src/**/*.ts"
---

Writing routes/data-access in `packages/server`. Architecture: `packages/server/CLAUDE.md`.

## Three-layer split, one per domain

- `src/db/<domain>.ts` — data-access functions, `using client = await smartClient();`. Owns that domain's zod schemas + row→API mapping
- `src/routers/<domain>.ts` — that domain's Hono instance, owns its full paths (`/entries`, `/entries/:id`)
- `src/app.ts` — composes routers via chained `.route("/", ...)` off one `Hono()`. Must stay one chained expression, `AppType` depends on it. New domain: new router file + one more `.route()` call, don't grow `app.ts` route-by-route

## Validation schemas live in `db/<domain>.ts`, not `common`

Server is the only validation boundary. Client just needs the shape, via `InferRequestType` (`client-api.md`) — no hand-duplicated `common` types, piqued/Hono already generate them.

## Two gotchas that degrade client inference to `unknown`

- Array or conditional returns need an explicit annotation, derived not hand-written:
  ```ts
  export const getAllEntries = async (): Promise<Array<ReturnType<typeof toApiEntry>>> => { ... };
  ```
- Never mix `c.notFound()` with `c.json(...)` in one handler, use `c.json({ error: "..." }, 404)` for both branches

If client-side type comes back `unknown`, check these two first.

After any routing restructure (splitting/merging routers, changing `.route()` composition), typecheck passing isn't proof `AppType` inference survived. Confirm with a real request too, not just `tsc`.
