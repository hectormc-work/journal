import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  addPromptGroupSchema,
  addPromptGroupToEntry,
  addPromptResponseSchema,
  addPromptToEntry,
  createEntry,
  createEntrySchema,
  deleteEntry,
  getAllEntries,
  getEntryById,
  updateEntry,
  updateEntrySchema,
} from "../db/entries.js";
import { listPromptResponsesForEntry } from "../db/prompt-responses.js";
import { entryMarkdownFilename, entryToMarkdown } from "../markdown.js";

export const entriesRouter = new Hono()
  .get("/entries", async (c) => {
    const entries = await getAllEntries();
    return c.json(entries);
  })
  .post("/entries", zValidator("json", createEntrySchema), async (c) => {
    const { entry, created } = await createEntry(c.req.valid("json"));
    return c.json(entry, created ? 201 : 200);
  })
  .put("/entries/:id", zValidator("json", updateEntrySchema), async (c) => {
    const entry = await updateEntry(c.req.param("id"), c.req.valid("json"));
    if (!entry) return c.json({ error: "Not found" }, 404);
    return c.json(entry);
  })
  .delete("/entries/:id", async (c) => {
    await deleteEntry(c.req.param("id"));
    return c.body(null, 204);
  })
  .get("/entries/:id/export", async (c) => {
    const entry = await getEntryById(c.req.param("id"));
    if (!entry) return c.json({ error: "Not found" }, 404);
    const responses = await listPromptResponsesForEntry(entry.id);
    c.header(
      "Content-Disposition",
      `attachment; filename="${entryMarkdownFilename(entry)}"`,
    );
    return c.text(entryToMarkdown(entry, responses), 200, {
      "Content-Type": "text/markdown; charset=utf-8",
    });
  })
  .post(
    "/entries/:id/prompt-groups",
    zValidator("json", addPromptGroupSchema),
    async (c) => {
      const responses = await addPromptGroupToEntry(
        c.req.param("id"),
        c.req.valid("json"),
      );
      return c.json(responses, 201);
    },
  )
  .post(
    "/entries/:id/prompt-responses",
    zValidator("json", addPromptResponseSchema),
    async (c) => {
      const response = await addPromptToEntry(
        c.req.param("id"),
        c.req.valid("json"),
      );
      return c.json(response, 201);
    },
  )
  .get("/entries/:id/prompt-responses", async (c) => {
    const responses = await listPromptResponsesForEntry(c.req.param("id"));
    return c.json(responses);
  });
