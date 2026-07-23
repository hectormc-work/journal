# packages/client — conventions

## `src/api.ts` — domain-organized wrapper over the raw Hono client

Components never call the raw `hc<AppType>` client directly — they call `api.entry.list()` / `.create(body)` / `.update(id, body)` / `.remove(id)`. `api.ts` is the one file that touches `hc`/`InferRequestType`/`InferResponseType`; everything else imports the `Entry` type and the `api` object from there.

Request/response body types are derived from the actual route (`InferRequestType<typeof client.entries.$post>["json"]`, `InferResponseType<typeof client.entries.$get>[number]`) — never hand-declared. This is also why `packages/common` doesn't export `Entry`/`CreateEntry`/`UpdateEntry` types: they'd just be a second, driftable copy of what Hono already infers from `AppType`. See `packages/server/CLAUDE.md` for the server-side half of this.

**No generic `unwrap<T>(res)` helper** — tried it, doesn't work. `zValidator`-guarded routes have a response type that's a _union_ (success shape | validation-error shape), and `ClientResponse.ok` only narrows that union via TypeScript's control-flow analysis on the _concrete_ variable at the call site — passing the response through an abstracted helper function loses that narrowing and `res.json()` degrades to `unknown`. Each method inlines its own check instead:

```ts
update: async (id: string, body: UpdateEntryBody): Promise<Entry> => {
  const res = await entryById.$put({ param: { id }, json: body });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
},
```

## One component per file

`components/` holds single-responsibility pieces (`EntrySidebar.vue`, `EntryBodyEditor.vue`, `EntryDetail.vue`, `QuestionsPanel.vue`); `pages/HomePage.vue` orchestrates them (owns the `entries` list, selection state, top-level error banner) rather than being one large monolithic page component.

## Layout: master-detail, not calendar/date-picker

`EntrySidebar` (flat list, `created_at` order, "+ New entry" button) + `EntryDetail` (50/50 split: `EntryBodyEditor` left, `QuestionsPanel` placeholder right, reserved for Phase 4). "New entry" always defaults to today's date; the date itself is editable afterward via a date input in `EntryBodyEditor` (next to the name field), saved via the same full-replace PUT as every other field.

`entry_date` is a civil date string (`"YYYY-MM-DD"`, never a `Date` object) end to end — parse it via explicit `y/m/d` components when formatting for display (`new Date(year, month - 1, day)`), never `new Date(isoString)` directly, which parses date-only strings as UTC midnight and can display a day off in non-UTC-adjacent timezones.
