---
paths:
  - "packages/client/src/api.ts"
---

Writing `api.ts`, the one file touching `hc`/`InferRequestType`/`InferResponseType`. Consuming it: `vue-components.md`.

## Derive types from the route, never hand-declare

`InferRequestType<typeof client.entries.$post>["json"]`, `InferResponseType<typeof client.entries.$get>[number]`. Same reason `common` doesn't export `Entry`/`CreateEntry` — a hand type would just drift from what Hono infers. Server-side half: `hono-routes.md`.

## No generic `unwrap<T>(res)` helper

Tried it, doesn't work. `zValidator` routes return a union (success | validation-error); `ClientResponse.ok` only narrows it via control-flow analysis on the concrete call-site variable, an abstracted helper loses that and `res.json()` degrades to `unknown`. Inline the check per method:

```ts
update: async (id: string, body: UpdateEntryBody): Promise<Entry> => {
  const res = await entryById.$put({ param: { id }, json: body });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
},
```
