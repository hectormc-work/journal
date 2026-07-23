---
paths:
  - "**/*.sql"
---

How to write sql piqued code. Binary piqued, not package piqued.

Not migrations, see the `piqued-upgrade` skill for those.

## Comments

`COMMENT ON TABLE`/`COMMENT ON COLUMN` and `--` docs: one short line, not a paragraph.

- A fragment, not a full sentence explaining the rationale
- If in doubt, cut it shorter, most columns need no comment at all

## Column naming: date vs. timestamp

The suffix is the type, always. Mismatch between the two is how `task.done_at` shipped as a `timestamptz` when it needed to be a `date`.

- `_date` suffix: a `date` column, a calendar day, no time component (e.g. `entry_date`, `done_date`)
- `_at` suffix: a `timestamptz` column, a specific instant (e.g. `created_at`, `updated_at`)
- Picking the suffix is picking the type. If it's "which day," it's `_date`. If it's "when exactly," it's `_at`.

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
