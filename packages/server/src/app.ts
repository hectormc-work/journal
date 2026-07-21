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
} from "./db/entries.js";
import {
  createPromptGroup,
  createPromptGroupSchema,
  deletePromptGroup,
  listPromptGroups,
} from "./db/prompt-groups.js";
import {
  deletePromptResponse,
  listPromptResponsesForEntry,
  updatePromptResponse,
  updatePromptResponseSchema,
} from "./db/prompt-responses.js";
import {
  createPrompt,
  createPromptSchema,
  deletePrompt,
  listPrompts,
} from "./db/prompts.js";
import { entryMarkdownFilename, entryToMarkdown } from "./markdown.js";

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
  })
  .patch(
    "/prompt-responses/:id",
    zValidator("json", updatePromptResponseSchema),
    async (c) => {
      const response = await updatePromptResponse(
        c.req.param("id"),
        c.req.valid("json"),
      );
      if (!response) return c.json({ error: "Not found" }, 404);
      return c.json(response);
    },
  )
  .delete("/prompt-responses/:id", async (c) => {
    await deletePromptResponse(c.req.param("id"));
    return c.body(null, 204);
  })
  .get("/prompt-groups", async (c) => {
    const groups = await listPromptGroups();
    return c.json(groups);
  })
  .post(
    "/prompt-groups",
    zValidator("json", createPromptGroupSchema),
    async (c) => {
      const group = await createPromptGroup(c.req.valid("json"));
      return c.json(group, 201);
    },
  )
  .delete("/prompt-groups/:id", async (c) => {
    await deletePromptGroup(c.req.param("id"));
    return c.body(null, 204);
  })
  .get("/prompts", async (c) => {
    const prompts = await listPrompts();
    return c.json(prompts);
  })
  .post("/prompts", zValidator("json", createPromptSchema), async (c) => {
    const prompt = await createPrompt(c.req.valid("json"));
    return c.json(prompt, 201);
  })
  .delete("/prompts/:id", async (c) => {
    await deletePrompt(c.req.param("id"));
    return c.body(null, 204);
  });

export const app = routes;
export type AppType = typeof routes;
