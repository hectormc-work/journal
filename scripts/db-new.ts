// piqued-migrate's `new <directory> <newUpgrade>` creates `<newUpgrade>#<hash>`
// literally where `newUpgrade` points (cwd-relative), ignoring `directory` for
// placement — it only reads `directory` to find the graph's current heads. So
// this wrapper builds the full target path under packages/db/upgrades itself.
import { execFileSync } from "node:child_process";
import * as path from "node:path";

const [name] = process.argv.slice(2);
if (!name) {
  console.error("Usage: yarn db:new <name>");
  process.exit(1);
}

const upgradesDir = path.join(import.meta.dirname, "../packages/db/upgrades");
const target = path.join(upgradesDir, name);

// `yarn workspace @journal/db exec` resolves the `piqued-migrate` bin correctly
// (it's a dependency of packages/db, not root) — a plain execFileSync call
// doesn't get Yarn's node_modules/.bin PATH injection at all.
execFileSync(
  "yarn",
  [
    "workspace",
    "@journal/db",
    "exec",
    "piqued-migrate",
    "new",
    upgradesDir,
    target,
  ],
  { stdio: "inherit" },
);
