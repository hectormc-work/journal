// Collapses the manual `db:up` -> wait for Postgres -> `db:upgrade` -> piqued
// codegen sequence from the README into one command. Doesn't install Docker
// or the piqued binary themselves -- those are one-time, interactive,
// machine-level installs (piqued's own installer needs a sudo prompt and
// can't be scripted headlessly), so this fails fast with a pointer to the
// README's Prerequisites section instead of trying to paper over them.
import { execSync } from "node:child_process";

function run(cmd: string) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function dockerRunning(): boolean {
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Not @journal/db's smartClient -- piqued's client doesn't reject cleanly on
// a refused connection (throws via an unhandled rejection deep inside, which
// crashes the whole script instead of being catchable here). pg_isready
// inside the container itself is a much sturdier readiness check.
function postgresReady(): boolean {
  try {
    execSync("docker compose exec -T db pg_isready -U journal", {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

if (!dockerRunning()) {
  console.error(
    "Docker doesn't seem to be running. Install/start Docker Desktop, then re-run `yarn setup`.",
  );
  process.exit(1);
}

run("docker compose up -d");

console.log("\nWaiting for Postgres to accept connections...");
const deadline = Date.now() + 30_000;
while (!postgresReady()) {
  if (Date.now() > deadline) {
    console.error("Postgres never came up after 30s.");
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 500));
}
console.log("Postgres is up.");

// Dynamic import, not a static one at the top of the file -- @journal/db's
// client.ts does `await buildColumnOrderCache(tables, pool)` as a top-level
// side effect at module load, which needs Postgres reachable *at import
// time*. A static import would race the wait-loop above instead of coming
// after it.
const { upgrade } = await import("@journal/db");

console.log("\nApplying schema migrations...");
await upgrade(undefined, { allowDowngrade: false });

console.log("\nGenerating typed queries (piqued codegen)...");
try {
  run("piqued --config piqued.toml");
} catch {
  console.error(
    "\n`piqued` isn't on your PATH. Install it first:\n" +
      "  curl https://raw.githubusercontent.com/zwade/piqued/refs/heads/master/rust/piqued/scripts/install.sh | bash\n" +
      "then re-run `yarn setup`.",
  );
  process.exit(1);
}

console.log("\nAll set — run `yarn dev` to start the app.");
