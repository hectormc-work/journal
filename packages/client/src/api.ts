import { hc } from "hono/client";
import type { InferRequestType, InferResponseType } from "hono/client";

import type { AppType } from "@journal/server";

// Raw typed RPC client — routes, params, and response bodies all come from
// the server's inferred AppType (type-only import, so no server code is
// bundled). `api` below wraps it into a friendlier surface — components call
// api.entry.create(...) etc. instead of touching this directly.
const client = hc<AppType>("/").api;

export type Entry = InferResponseType<typeof client.entries.$get>[number];

type CreateEntryBody = InferRequestType<typeof client.entries.$post>["json"];

const entryById = client.entries[":id"];
type UpdateEntryBody = InferRequestType<typeof entryById.$put>["json"];

export const api = {
  entry: {
    list: async (): Promise<Entry[]> => {
      const res = await client.entries.$get();
      return res.json();
    },

    create: async (body: CreateEntryBody): Promise<Entry> => {
      const res = await client.entries.$post({ json: body });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },

    update: async (id: string, body: UpdateEntryBody): Promise<Entry> => {
      const res = await entryById.$put({ param: { id }, json: body });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },

    remove: async (id: string): Promise<void> => {
      const res = await entryById.$delete({ param: { id } });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
    },
  },
};
