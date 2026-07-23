import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  createEntry,
  createEntrySchema,
  deleteEntry,
  getAllEntries,
  updateEntry,
  updateEntrySchema,
} from "./db/entries.js";

// Routes must stay chained off one expression — AppType is inferred from the
// chain, and that inference is what gives the client its typed RPC calls.
const routes = new Hono()
  .basePath("/api")
  .get("/health", (c) =>
    c.json({
      status: "ok" as const,
      time: new Date().toISOString(),
    }),
  )
  .get("/entries", async (c) => {
    const entries = await getAllEntries();
    return c.json(entries);
  })
  .post("/entries", zValidator("json", createEntrySchema), async (c) => {
    const entry = await createEntry(c.req.valid("json"));
    return c.json(entry, 201);
  })
  .put("/entries/:id", zValidator("json", updateEntrySchema), async (c) => {
    const entry = await updateEntry(c.req.param("id"), c.req.valid("json"));
    if (!entry) return c.json({ error: "Not found" }, 404);
    return c.json(entry);
  })
  .delete("/entries/:id", async (c) => {
    await deleteEntry(c.req.param("id"));
    return c.body(null, 204);
  });

export const app = routes;
export type AppType = typeof routes;
