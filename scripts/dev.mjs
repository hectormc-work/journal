// Hand-rolled dev runner: spawns server + client, prefixes output, dies together.
import { spawn } from "node:child_process";

const workspaces = ["@journal/server", "@journal/client"];

let shuttingDown = false;
const procs = [];

const shutdown = (code) => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const p of procs) p.kill("SIGINT");
  setTimeout(() => process.exit(code), 300).unref();
};

for (const ws of workspaces) {
  const name = ws.split("/")[1];
  const p = spawn("yarn", ["workspace", ws, "dev"], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  const prefix = (stream, out) => {
    let buf = "";
    stream.on("data", (chunk) => {
      buf += chunk;
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) out.write(`[${name}] ${line}\n`);
    });
  };
  prefix(p.stdout, process.stdout);
  prefix(p.stderr, process.stderr);

  p.on("exit", (code) => shutdown(code ?? 0));
  procs.push(p);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
