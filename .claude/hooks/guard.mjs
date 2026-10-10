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
  /^[^.].*\.(pem|key|p12|pfx|jks|keystore)$/i, // `.foo.key` (jq yolu gibi) dosya adı sayılmaz
  /^id_(rsa|dsa|ecdsa|ed25519)$/,
  /^\.npmrc$/, /^\.netrc$/,
];
const isSecret = (p) => {
  if (!p) return false;
  const abs = path.isAbsolute(p) ? p : path.join(input.cwd || root, p);
  return SECRET_NAMES.some((re) => re.test(path.basename(abs)));
};

/**
 * Bash komutunda dosya yolu gibi görünen parçalar. Komut kabuk kelimelerine bölünür (boşluk ve `; | & < > ( )`;
 * tırnaklı metin tek kelimedir, tırnaklar atılır), kelimeler `=`'den bölünür (`--env-file=…`). Yalnız yol
 * karakterlerinden oluşan parça yol sayılır; `${x.key}`, `console.log(obj.key)` ya da boşluklu bir kod parçası
 * yol değildir. Tek başına duran `obj.key` kelimesi dosya adından ayırt edilemez, yol sayılır.
 */
function pathLikeTokens(cmd) {
  const words = cmd.match(/"[^"]*"|'[^']*'|`[^`]*`|[^\s;|&<>()]+/g) ?? [];
  return words
    .map((w) => w.replace(/^["'`]|["'`]$/g, ""))
    .flatMap((w) => w.split("="))
    .filter((t) => /^[\w.@%+~/:-]+$/.test(t));
}

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
  // `--env-file=.env`, `>.env`, `"x/.env"`, `$(cat .env)` gibi biçimleri de yakalar.
  for (const tok of pathLikeTokens(String(ti.command ?? ""))) {
    if (isSecret(tok)) block(`Bash komutu gizli dosyaya değiniyor: ${tok}`);
  }
}

process.exit(0);
