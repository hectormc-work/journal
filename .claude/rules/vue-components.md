---
paths:
  - "packages/client/**/*.vue"
---

Writing Vue components in `packages/client`. API conventions: `client-api.md`. Package overview: `packages/client/CLAUDE.md`.

## One component per file

`components/` holds single-responsibility pieces. A page (`pages/HomePage.vue`) orchestrates them and owns shared state, not one monolithic component.

## Call `api.ts`, never `hc<AppType>` directly

`api.entry.list()` / `.create()` / `.update()` / `.remove()`. See `client-api.md`.

## `entry_date` is a civil date string, not a `Date`

`"YYYY-MM-DD"` end to end. Format via explicit `y/m/d`: `new Date(year, month - 1, day)`. Never `new Date(isoString)`, it parses as UTC midnight and can show a day off outside UTC-adjacent timezones.
