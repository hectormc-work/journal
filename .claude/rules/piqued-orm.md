---
paths:
  - "**/*.ts"
---

How to use the piqued ORM/package (`@piqued/client` npm, wrapped by `@journal/db`). Not the binary, see `piqued-sql.md`/`piqued-migrate` skill for that.

## Query builder

Always against a generated `TableBuilder`, always with an explicit client.

- `import { Delete, Insert, Op, Select, Update, smartClient } from "@journal/db"`
  - Never reach past it to `@piqued/client` directly
- Every call needs an explicit client: `using client = await smartClient();`
  - No implicit pool fallback
- `Select(...Table.star).from(Table).where(Op.eq(...)).many/opt/one(client)`
  - `.many()` is an array, `.opt()` is zero-or-one, `.one()` throws if missing
- `Insert(Table).values({...}).returning(...Table.star).one(client)`
- `Update(Table).set({...}).where(...).returning(...Table.star).one(client)`
- `Delete(Table).where(...).execute(client)`
- `Op`: `eq/lt/lte/gt/gte/is/isNot/in_/not/and/or/isNull/isNotNull/coalesce/count/min/max/arrayAgg/concat`
  - No `between`, compose `Op.and(Op.gte(...), Op.lt(...))` instead
  - Multiple chained `.where()` calls AND together

## When not to reach for a join

Small/personal-scale relational data (e.g. grouping child rows under a parent).

- Fetch unfiltered, assemble/group in JS
- Don't reach for a join query or hand-written `.sql` for this
- Precedent: `prompts.ts` grouping by `group_id`

## Gotcha: importing connects to Postgres immediately

`client.ts` does `await buildColumnOrderCache(tables, pool)` as a top-level module-load side effect.

- A static top-level `import` races anything that needs to check/wait for Postgres availability first (bit `scripts/setup.ts`)
- If sequencing matters: `await import("@journal/db")` dynamically, after confirming readiness some other way (e.g. `pg_isready`, not `@journal/db` itself, that's chicken-and-egg)
