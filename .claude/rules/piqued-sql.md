---
paths:
  - "**/*.sql"
---

How to write sql piqued code. Binary piqued, not package piqued.

Not migrations, see the `piqued-migrate` skill for those.

## Hand-written query files

Minority of queries, complex joins/aggregates being actively optimized. Ordinary CRUD uses the query builder instead, see `piqued-orm.md`.

- Plain `--` comments are docs only, ignored by codegen
- `-- @params name1 name2 ...`: canonical ordered parameter list
  - `:name` and positional `$N` (matching this order) are interchangeable in the same file
- `-- @xtemplate name (default-sql-expr)`: compile-time textual substitution, not a bound parameter, with a default
  - For where SQL can't bind directly: `IN (...)` lists, `ASC`/`DESC`, etc.
- `PREPARE <name> AS ...;` is the real statement
  - `<name>` becomes the generated function's name

## Codegen

Reads these files from `[workspace].root` (set in root `piqued.toml`) and emits typed functions.

- What gets generated, where: `packages/db/CLAUDE.md`'s Runtime pattern section
- Command and ordering (must run after migrations): root `CLAUDE.md`
