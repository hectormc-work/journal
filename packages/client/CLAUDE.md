# packages/client — Vite 8 + Vue 3.5

Composition API, `<script setup lang="ts">`, vue-router 5. Talks to `packages/server` via `hc<AppType>`, wrapped by `src/api.ts`.

## Layout

- `src/api.ts` — only file touching `hc`/`InferRequestType`/`InferResponseType`. Conventions: `.claude/rules/client-api.md`
- `components/` — one component per file (`EntrySidebar.vue`, `EntryBodyEditor.vue`, `EntryDetail.vue`, `PromptsPanel.vue`). Conventions: `.claude/rules/vue-components.md`
- `pages/HomePage.vue` — orchestrates the components, owns `entries` list, selection state, error banner

## Master-detail layout, not calendar/date-picker

`EntrySidebar` (flat list, "+ New entry") + `EntryDetail` (50/50 split: `EntryBodyEditor` left, `PromptsPanel` placeholder right, Phase 4). "New entry" defaults to today; date is editable after via `EntryBodyEditor`, saved via the same full-replace PUT as every other field.
