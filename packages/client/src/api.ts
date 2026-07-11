import { hc } from "hono/client";

import type { AppType } from "@journal/server";

// Typed RPC client — routes, params, and response bodies all come from the
// server's inferred AppType. Type-only import, so no server code is bundled.
export const api = hc<AppType>("/");
