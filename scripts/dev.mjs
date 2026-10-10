#!/usr/bin/env node
// `npm run dev`: API (3001) + web (8080) together; Vite proxies /api to the API.
// Output lines are prefixed; Ctrl-C or either process exiting stops both.
import { spawn } from "node:child_process";

const procs = [
  ["api", "@rabbitqa/api", "\x1b[36m"],
  ["web", "@rabbitqa/web", "\x1b[35m"],
].map(([name, workspace, color]) => {
  const child = spawn("npm", ["run", "dev", "-w", workspace], { stdio: ["ignore", "pipe", "pipe"], detached: true });
  const prefix = `${color}[${name}]\x1b[0m `;
  for (const stream of [child.stdout, child.stderr]) {
    let buf = "";
    stream.on("data", (d) => {
      buf += d;
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) process.stdout.write(prefix + line + "\n");
    });
  }
  child.on("exit", (code) => {
    process.stdout.write(`${prefix}exited (${code ?? "signal"})\n`);
    stop(code ?? 0);
  });
  return child;
});

let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const p of procs) {
    try {
      process.kill(-p.pid, "SIGTERM");
    } catch {
      // already gone
    }
  }
  process.exitCode = code;
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
