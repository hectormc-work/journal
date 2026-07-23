import { parseArgs } from "node:util";

import { upgrade } from "@journal/db";

const {
  values: { version, allowDowngrade },
} = parseArgs({
  options: {
    version: {
      type: "string",
    },
    allowDowngrade: {
      type: "boolean",
      default: false,
      short: "d",
    },
  },
});

await upgrade(version, { allowDowngrade });
process.exit(0);
