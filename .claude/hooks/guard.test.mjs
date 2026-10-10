// node --test .claude/hooks/guard.test.mjs (part of npm test) — guard.mjs runs as a child process, like Claude Code calls it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const GUARD = fileURLToPath(new URL("./guard.mjs", import.meta.url));
const run = (tool_name, tool_input) =>
  spawnSync(process.execPath, [GUARD], { input: JSON.stringify({ tool_name, tool_input, cwd: "/repo" }), encoding: "utf8" }).status;
const bash = (command) => run("Bash", { command });

test("Bash: path-like secret tokens are blocked", () => {
  for (const cmd of [
    "cat id_rsa", "cat ~/.ssh/id_ed25519", "cat server.key", "ls certs/a.pem", 'cp x "certs/a.pem"', "openssl x509 -in a.PEM",
    "cat .env", "node --env-file=.env x.js", "echo x >.env.local", "echo $(cat .env)", "cat .npmrc",
  ]) assert.equal(bash(cmd), 2, cmd);
});

test("Bash: code that merely mentions .key is allowed", () => {
  for (const cmd of [
    'node -e "console.log(obj.key)"', "echo ${x.key}", 'echo "${x.key"', "jq .data.key f.json", "node -e 'const k = obj.key; f(k)'",
    "cat .env.example", "ls apps/api", "grep -rn keystore src",
  ]) assert.equal(bash(cmd), 0, cmd);
});

test("file tools: secret paths are blocked, others allowed", () => {
  assert.equal(run("Read", { file_path: "/repo/.env" }), 2);
  assert.equal(run("Edit", { file_path: "/repo/certs/server.key" }), 2);
  assert.equal(run("Read", { file_path: "/repo/.env.example" }), 0);
  assert.equal(run("Read", { file_path: "/repo/src/keys.ts" }), 0);
});
