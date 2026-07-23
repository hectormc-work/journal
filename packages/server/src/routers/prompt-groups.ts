import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  createPromptGroup,
  createPromptGroupSchema,
  deletePromptGroup,
  listPromptGroups,
} from "../db/prompt-groups.js";

export const promptGroupsRouter = new Hono()
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
  });
