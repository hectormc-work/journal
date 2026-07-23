---
name: piqued-downgrade
description: Go backward in the piqued migration DAG (undo the latest migration, or fix an unpublished migration's DDL in place). Use whenever the DB needs to go to an earlier schema version. Never by hand-editing the live DB, see root CLAUDE.md.
---

## Steps

1. Find the target version: the `parents` field in the migration's own `migration.toml`, or an earlier version's directory name.
2. `yarn db:upgrade --version <target> --allowDowngrade` (root script, `-d` short flag also works). Downgrading is blocked by default (`preventDowngrade`), the flag is required on purpose.
3. If fixing an unpublished migration: edit its `upgrade.sql`/`downgrade.sql` now, DDL only, no pragma syntax (`.claude/rules/piqued-sql.md`). Editing in place is fine before it's committed/shared, the hash comes from name and parents, not content. Once shared, write a new migration on top instead.
4. `yarn db:upgrade` (no `--version`) to go back to the latest head, re-running the corrected `upgrade.sql` for real.
5. `piqued --config piqued.toml` to regenerate typed files against the now-current schema.

## Careful

- `downgrade.sql` needs to actually work (the reverse DDL, e.g. `DROP TABLE`), step 2 runs it
- Full create-and-apply workflow for a new migration: `piqued-upgrade` skill
