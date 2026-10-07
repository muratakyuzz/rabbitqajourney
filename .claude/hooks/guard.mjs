#!/usr/bin/env node
// Claude Code PreToolUse guard — RabbitQA Onboarding Tracker
// Bu repoda Claude Code iki ayrı oturumla çalışır (docs/WORKFLOW.md → "İki oturum"):
//   - Denetim oturumu (varsayılan, `claude`): uygulama kodu, paket dosyaları, git geçmişi ve
//     uzak veritabanı YASAK. Plan, review ve ADR yazar.
//   - Uygulama rolü (.claude/role = builder): kod/test yazar, branch'e commit/push eder (PR yok).
//     main'e push, force push, merge, plan/review dosyalarını değiştirme ve uzak DB YASAK.
// Emniyet kemeridir, kusursuz sandbox değildir — ajan talimatları birincil kontroldür.

import path from "node:path";
import fs from "node:fs";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
let input;
try { input = JSON.parse(raw); } catch { process.exit(0); }

const tool = input.tool_name ?? "";
const ti = input.tool_input ?? {};
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();

// Rol: CLAUDE_ROLE ortam değişkeni (terminal) veya .claude/role dosyası (IDE eklentisi).
// Dosyayı yalnızca Murat terminalden değiştirir: `echo builder > .claude/role` / `rm .claude/role`.
let fileRole = "";
try { fileRole = fs.readFileSync(path.join(root, ".claude", "role"), "utf8").trim(); } catch {}
const ROLE = (process.env.CLAUDE_ROLE || fileRole) === "builder" ? "builder" : "auditor";

// Denetim oturumunun yazamadığı yollar
const APP_PATHS = [
  // uygulama kodu ve testler
  /^apps\//, /^packages\//, /^migrations\//, /^e2e\//,
  // mockup'ın mevcut tek paket yapısı (F0-03 monorepo'ya taşıyana kadar)
  /^src\//, /^supabase\//, /^public\//, /^tests?\//, /^index\.html$/,
  // altyapı ve yapılandırma
  /^docker\//, /^Dockerfile/, /^docker-compose[^/]*\.ya?ml$/, /^compose[^/]*\.ya?ml$/,
  /^\.github\/workflows\//,
  /^package(-lock)?\.json$/, /^bun\.lockb?$/, /^pnpm-lock\.yaml$/, /^yarn\.lock$/,
  /^tsconfig[^/]*\.json$/, /^(vite|vitest|playwright|tailwind|postcss|eslint)\.config\.[cm]?[jt]s$/,
  /^\.env/, /^\.mcp\.json$/,
  /^\.claude\/role$/, // rolü yalnızca Murat değiştirir
];

// Uygulama oturumunun yazamadığı yollar (denetim çıktıları, kurallar, kit)
const AUDIT_PATHS = [
  /^docs\/plans\//, /^docs\/reviews\//, /^docs\/INVARIANTS\.md$/, /^docs\/RBAC\.md$/,
  /^docs\/PRODUCT_SPEC\.md$/, // tek doğruluk kaynağı; yalnızca denetim (Murat onayıyla) — REV-F022
  /^docs\/agents\//, /^docs\/adr\//, /^AGENTS\.md$/, /^CLAUDE\.md$/, /^\.claude\//,
  /^\.env(?!\.example$)/, // .env.example'ı uygulama yazar (değer içermez); .env ve diğer .env.* korumalı — F0-02 D11
  /^\.github\/workflows\//,
];

const PROTECTED = ROLE === "builder" ? AUDIT_PATHS : APP_PATHS;

function rel(p) {
  if (!p) return "";
  const abs = path.isAbsolute(p) ? p : path.join(input.cwd || root, p);
  let r = path.relative(root, abs).split(path.sep).join("/");
  r = r.replace(/^\.verify\/[^/]+\//, ""); // worktree kopyaları da korunur
  return r;
}
const isProtected = (p) => { const r = rel(p); return !r.startsWith("..") && PROTECTED.some((re) => re.test(r)); };

function block(msg) {
  const hint = ROLE === "builder"
    ? `Bu UYGULAMA oturumu (rol: .claude/role veya CLAUDE_ROLE). Plan/review/kural dosyaları denetim oturumunda değişir; main'e push ve merge'ü Murat yapar.`
    : `Bu DENETİM oturumu; uygulama kodunu uygulama oturumu yazar (terminalde "echo builder > .claude/role", sonra yeni sohbet). Bulguyu rapora ve düzeltme direktifine yaz.`;
  process.stderr.write(`ENGELLENDİ (guard.mjs, rol: ${ROLE}): ${msg}\n${hint}\n`);
  process.exit(2);
}

// 1) Dosya yazan araçlar
if (/^(Write|Edit|MultiEdit|NotebookEdit)$/.test(tool)) {
  const p = ti.file_path || ti.notebook_path;
  if (isProtected(p)) block(`${tool} → ${rel(p)} korumalı bir yol.`);
  process.exit(0);
}

// 2) Bash
if (tool === "Bash") {
  const cmd = String(ti.command || "");

  // Her iki rolde de yasak
  const REMOTE_DB = /\b(psql|pg_dump|pg_restore)\b[^|;&]*(-h|--host|postgres(ql)?:\/\/)/;
  if (REMOTE_DB.test(cmd)) block(`uzak PostgreSQL'e bağlanan komut. Test/canlı veritabanına Claude erişmez.`);
  if (/\bgh\s+pr\s+merge\b/.test(cmd) || /\bgit\b[^;&|]*\bmerge\b[^;&|]*\b(origin\/)?main\b[^;&|]*&&[^;&|]*\bpush\b/.test(cmd))
    block(`merge yalnızca Murat tarafından, gate sonrası yapılır.`);

  if (ROLE === "builder") {
    if (/\bgit\b[^;&|]*\bpush\b[^;&|]*(--force\b|-f\b|--force-with-lease\b|\+\S)/.test(cmd)) block(`force push yasak.`);
    if (/\bgit\b[^;&|]*\bpush\b[^;&|]*\b(main|master)\b/.test(cmd)) block(`main'e doğrudan push yasak; feature branch'e push et, main'e merge'ü Murat yapar.`);
    if (/\bgit\b[^;&|]*\b(reset\s+--hard|clean\s+-[a-zA-Z]*f)/.test(cmd)) block(`geri alınamaz git komutu (reset --hard / clean -f).`);
    if (/\bgit\b[^;&|]*\btag\b/.test(cmd)) block(`etiketleri (ör. mockup-freeze) Murat atar.`);
  } else {
    const GIT_WRITE = /\bgit\b(?:\s+-C\s+\S+)?\s+(commit|push|merge|rebase|reset|cherry-pick|revert|stash|checkout|switch|restore|clean|am|apply|tag|branch\s+-[dDmM])\b/;
    if (GIT_WRITE.test(cmd)) block(`git geçmişini/çalışma ağacını değiştiren komut: "${cmd.match(GIT_WRITE)[0]}". Branch incelemek için /gate'in worktree yöntemini kullan.`);

    const PKG = /\b(npm|pnpm|yarn|bun)\s+(i|install|add|remove|rm|uninstall|update|up|upgrade)\b/;
    if (PKG.test(cmd)) block(`paket bağımlılıklarını değiştiren komut. Yalnızca "npm ci" serbest.`);
  }

  // Yönlendirme hedefleri
  for (const m of cmd.matchAll(/(?:^|[^0-9&<>])>{1,2}\|?\s*(['"]?)([^\s'";&|<>]+)\1/g)) {
    if (isProtected(m[2])) block(`yönlendirme ile korumalı dosyaya yazma: ${m[2]}`);
  }
  // Dosya değiştiren komutlar + korumalı yol
  const MUTATORS = /\b(sed\s+(-[a-zA-Z]*i|--in-place)|perl\s+-[a-zA-Z]*i|tee|rm|rmdir|mv|cp|touch|truncate|chmod|chown|ln|dd|install|unlink|patch)\b/;
  if (MUTATORS.test(cmd)) {
    const tokens = cmd.split(/[\s;&|()]+/).map((t) => t.replace(/^['"]|['"]$/g, "")).filter(Boolean);
    const hit = tokens.find((t) => isProtected(t));
    if (hit) block(`dosya değiştiren komut korumalı yola dokunuyor: ${hit}`);
  }
  process.exit(0);
}

process.exit(0);
