# packages/server — Hono conventions

## Layout: routes vs data-access

Three-layer split, one per domain:

- `src/db/<domain>.ts` (e.g. `db/entries.ts`) — plain functions wrapping `@journal/db`'s query-builder calls (`Select`/`Insert`/`Update`/`Delete`/`Op` against a `TableBuilder`, `using client = await smartClient();` at the call site). Also owns that domain's zod validation schemas (see below) and the row→API shape mapping.
- `src/routers/<domain>.ts` (e.g. `routers/entries.ts`) — that domain's own chained Hono instance, owning its full absolute paths (`/entries`, `/entries/:id`, etc.). Route handlers call into the data-access functions and stay focused on HTTP concerns: validation via `zValidator`, status codes, param/query parsing.
- `src/app.ts` — composes every router via chained `.route("/", ...)` calls off one base `Hono()` instance. Still has to be a single chained expression end to end (`AppType` inference depends on it), just chained hierarchically across files now instead of flatly in one giant file. Adding a new domain: create its router file, `.route("/", newRouter)` into the chain — don't grow `app.ts` route-by-route.

## Validation schemas live here, not in `packages/common`

`createEntrySchema`/`updateEntrySchema` (and their `z.infer` types) are defined in `db/entries.ts`, right next to the functions that consume them — not in `common`. Only the server ever validates untrusted input (that's the actual boundary); the client doesn't need the zod schema, just the resulting shape, which it gets for free from `hono/client`'s `InferRequestType` off the real route (see `packages/client/CLAUDE.md`). Keeping schemas server-local also means no dead common-package exports that are only ever used for their `z.infer` type and never actually `.parse()`d (this happened once already — worth avoiding the pattern generally, not just for entries).

Same logic for output shapes: don't hand-declare a `common` type mirroring a DB row. Piqued already generates one (`Entry.t` etc., in `packages/db`); let the API's actual output type flow structurally from the handler function (no return-type annotation needed, usually — see the gotcha below for when you do need one).

## Two `c.json()`/inference gotchas hit while building this

TypeScript/Hono's route-chain type inference (what makes `AppType` — and therefore the client's `InferResponseType`/`InferRequestType` — work) is pickier than the server's own local typecheck. Both of these typecheck fine in isolation but silently degrade the **client-side** inferred type to `unknown` unless fixed:

1. **Arrays or conditionally-branching return values need an explicit return type.** A data-access function that unconditionally returns a single inferred object (e.g. `createEntry`) is fine with no annotation. One that `.map()`s over rows into an array, or conditionally returns `value | undefined`, needs an explicit annotation for `c.json(...)` to infer correctly on the client — derive it, don't hand-duplicate:
   ```ts
   export const getAllEntries = async (): Promise<Array<ReturnType<typeof toApiEntry>>> => { ... };
   export const updateEntry = async (...): Promise<ReturnType<typeof toApiEntry> | undefined> => { ... };
   ```
2. **Don't mix `c.notFound()` with `c.json(...)` in the same handler.** `c.notFound()` isn't a well-typed `TypedResponse` the way `c.json()` is, and mixing the two return paths in one handler poisons the inferred response type for the _whole_ route (not just the 404 branch) down to `unknown`. Use `c.json({ error: "..." }, 404)` instead — keeps every branch consistently typed:
   ```ts
   const entry = await updateEntry(id, input);
   if (!entry) return c.json({ error: "Not found" }, 404);
   return c.json(entry);
   ```

If a route's client-side type ever comes back as `unknown` unexpectedly, suspect one of these two before anything else.
