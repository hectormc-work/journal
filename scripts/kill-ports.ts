// Hand-rolled: frees the app's dev ports when a stale process survives a
// `yarn dev` that didn't shut down cleanly ("port already in use" on next run).
import { execSync } from "node:child_process";

const ports = [Number(process.env.PORT) || 3000, 5173];

for (const port of ports) {
  let pids: string;
  try {
    pids = execSync(`lsof -ti:${port} -sTCP:LISTEN`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    continue; // nothing listening on this port
  }

  if (!pids) continue;

  for (const pid of pids.split("\n")) {
    console.log(`Killing PID ${pid} on port ${port}`);
    try {
      process.kill(Number(pid), "SIGKILL");
    } catch (e) {
      console.error(
        `Failed to kill PID ${pid}: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
}
