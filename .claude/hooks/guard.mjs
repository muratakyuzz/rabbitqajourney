#!/usr/bin/env node
// Claude Code PreToolUse guard — RabbitQA Onboarding Tracker
// Yalnızca gizli dosyaları korur: `.env` / `.env.*` (`.env.example` hariç) ve anahtar/sertifika
// dosyaları. Bu dosyalar araçla okunmaz, yazılmaz; Bash komutunda geçemez. Gerekirse Murat elle yapar.
// Emniyet kemeridir, sandbox değildir — süreç kuralları docs/PLAN.md → "Çalışma kuralları".

import path from "node:path";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
let input;
try { input = JSON.parse(raw); } catch { process.exit(0); }

const tool = input.tool_name ?? "";
const ti = input.tool_input ?? {};
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();

// Dosya adı (son bileşen) üzerinden eşleşir
const SECRET_NAMES = [
  /^\.env$/, /^\.env\.(?!example$)[^/]+$/,
  /\.(pem|key|p12|pfx|jks|keystore)$/i,
  /^id_(rsa|dsa|ecdsa|ed25519)$/,
  /^\.npmrc$/, /^\.netrc$/,
];
const isSecret = (p) => {
  if (!p) return false;
  const abs = path.isAbsolute(p) ? p : path.join(input.cwd || root, p);
  return SECRET_NAMES.some((re) => re.test(path.basename(abs)));
};

function block(msg) {
  process.stderr.write(`ENGELLENDİ (guard.mjs): ${msg}\nGizli dosyalara Claude dokunmaz; gerekiyorsa kullanıcıdan elle yapmasını iste.\n`);
  process.exit(2);
}

if (["Read", "Write", "Edit", "MultiEdit", "NotebookEdit"].includes(tool)) {
  const p = ti.file_path ?? ti.notebook_path ?? "";
  if (isSecret(p)) block(`${tool} → ${p}`);
  process.exit(0);
}

if (tool === "Bash") {
  const cmd = String(ti.command ?? "");
  // Kelime sınırlarına göre parçala; `--env-file=.env`, `>.env`, `"x/.env"` gibi biçimleri de yakalar.
  for (const tok of cmd.split(/[\s'"`=<>|;&()]+/)) {
    if (tok && isSecret(tok)) block(`Bash komutu gizli dosyaya değiniyor: ${tok}`);
  }
}

process.exit(0);
