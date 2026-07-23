---
paths:
  - "**/*.ts"
---

How config gets read. One zod schema (`packages/common/src/settings.ts`) parses `process.env` once into a typed `settings` object.

- The only way config gets read anywhere, no ad-hoc `process.env` access
- Extend that one schema as new config is needed
- Import via `@journal/common/node`, never the default `@journal/common` entry — the default entry is also the client's browser bundle entry, and a top-level `process.env` read there breaks in the browser
- `src/node.ts` is the general home for anything node-only in `common`, not just settings
