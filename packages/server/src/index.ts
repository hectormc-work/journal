import { serve } from "@hono/node-server";
import { settings } from "@journal/common/node";

import { app } from "./app";

serve({ fetch: app.fetch, port: settings.server.port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
