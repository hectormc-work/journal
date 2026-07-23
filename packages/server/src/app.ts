import { Hono } from "hono";

import { entriesRouter } from "./routers/entries.js";
import { promptGroupsRouter } from "./routers/prompt-groups.js";
import { promptResponsesRouter } from "./routers/prompt-responses.js";
import { promptsRouter } from "./routers/prompts.js";
import { tasksRouter } from "./routers/tasks.js";

// Routes must stay chained off one expression — AppType is inferred from the
// chain, and that inference is what gives the client its typed RPC calls.
// Each domain's routes live in their own routers/<domain>.ts (own chained
// Hono instance, full absolute paths); .route() composition here keeps this
// one expression, just chained hierarchically instead of flatly.
const routes = new Hono()
  .basePath("/api")
  .get("/health", (c) =>
    c.json({
      status: "ok" as const,
      time: new Date().toISOString(),
    }),
  )
  .route("/", entriesRouter)
  .route("/", promptResponsesRouter)
  .route("/", promptGroupsRouter)
  .route("/", promptsRouter)
  .route("/", tasksRouter);

export const app = routes;
export type AppType = typeof routes;
