import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  createPrompt,
  createPromptSchema,
  deletePrompt,
  listPrompts,
} from "../db/prompts.js";

export const promptsRouter = new Hono()
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
