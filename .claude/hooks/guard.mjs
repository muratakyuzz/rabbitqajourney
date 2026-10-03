#!/usr/bin/env node
// Claude Code PreToolUse guard — RabbitQA Onboarding Tracker
// Claude bu repoda DENETÇİDİR: uygulama kodunu Codex yazar.
// Bu hook; ana oturum ve tüm subagent'lar için uygulama kodunu, paket dosyalarını
// ve git geçmişini değiştiren araç çağrılarını engeller.
// Emniyet kemeridir, kusursuz sandbox değildir — ajan talimatları birincil kontroldür.
// Bilinçli istisna için: CLAUDE_ALLOW_APP_WRITES=1 claude

import path from "node:path";

if (process.env.CLAUDE_ALLOW_APP_WRITES === "1") process.exit(0);

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
let input;
try { input = JSON.parse(raw); } catch { process.exit(0); }

const tool = input.tool_name ?? "";
const ti = input.tool_input ?? {};
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();

const PROTECTED = [
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
];

function rel(p) {
  if (!p) return "";
  const abs = path.isAbsolute(p) ? p : path.join(input.cwd || root, p);
  let r = path.relative(root, abs).split(path.sep).join("/");
  r = r.replace(/^\.verify\/[^/]+\//, ""); // worktree kopyaları da korunur
  return r;
}
const isProtected = (p) => { const r = rel(p); return !r.startsWith("..") && PROTECTED.some((re) => re.test(r)); };

function block(msg) {
  process.stderr.write(
    `ENGELLENDİ (guard.mjs): ${msg}\n` +
    `Claude bu repoda denetçi rolündedir; uygulama kodunu Codex yazar. ` +
    `Bulguyu rapora yaz ve düzeltmeyi Codex direktifine ekle.\n`
  );
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

  const GIT_WRITE = /\bgit\b(?:\s+-C\s+\S+)?\s+(commit|push|merge|rebase|reset|cherry-pick|revert|stash|checkout|switch|restore|clean|am|apply|tag|branch\s+-[dDmM])\b/;
  if (GIT_WRITE.test(cmd)) block(`git geçmişini/çalışma ağacını değiştiren komut: "${cmd.match(GIT_WRITE)[0]}". Branch incelemek için /gate'in worktree yöntemini kullan.`);

  const PKG = /\b(npm|pnpm|yarn|bun)\s+(i|install|add|remove|rm|uninstall|update|up|upgrade)\b/;
  if (PKG.test(cmd)) block(`paket bağımlılıklarını değiştiren komut. Yalnızca "npm ci" serbest.`);

  const REMOTE_DB = /\b(psql|pg_dump|pg_restore)\b[^|;&]*(-h|--host|postgres(ql)?:\/\/)/;
  if (REMOTE_DB.test(cmd)) block(`uzak PostgreSQL'e bağlanan komut. Test/canlı veritabanına Claude erişmez.`);

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
