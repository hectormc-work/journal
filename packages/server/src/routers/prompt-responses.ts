import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  deletePromptResponse,
  updatePromptResponse,
  updatePromptResponseSchema,
} from "../db/prompt-responses.js";

export const promptResponsesRouter = new Hono()
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
  });
