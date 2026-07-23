import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  createTask,
  createTaskSchema,
  deleteTask,
  listTasks,
  updateTask,
  updateTaskSchema,
} from "../db/tasks.js";

export const tasksRouter = new Hono()
  .get("/tasks", async (c) => {
    const tasks = await listTasks();
    return c.json(tasks);
  })
  .post("/tasks", zValidator("json", createTaskSchema), async (c) => {
    const task = await createTask(c.req.valid("json"));
    return c.json(task, 201);
  })
  .patch("/tasks/:id", zValidator("json", updateTaskSchema), async (c) => {
    const task = await updateTask(c.req.param("id"), c.req.valid("json"));
    if (!task) return c.json({ error: "Not found" }, 404);
    return c.json(task);
  })
  .delete("/tasks/:id", async (c) => {
    await deleteTask(c.req.param("id"));
    return c.body(null, 204);
  });
