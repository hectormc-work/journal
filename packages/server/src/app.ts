import { Hono } from "hono";

import type { Health } from "@journal/common";

// Routes must stay chained off one expression — AppType is inferred from the
// chain, and that inference is what gives the client its typed RPC calls.
const routes = new Hono().basePath("/api").get("/health", (c) =>
  c.json<Health>({
    status: "ok",
    time: new Date().toISOString(),
  }),
);

export const app = routes;
export type AppType = typeof routes;
