import fs from "node:fs";
import path from "node:path";
import { loadConfigFromFile } from "vite";

// F0-04a AC3 / AC-NEG2 (INV-14): Vite reads .env from the repo root and keeps the default VITE_ prefix.
// Runs in the default jsdom environment: src/test/setup.ts touches `window`, so a per-file node environment would fail in setup.
const webDir = path.resolve(import.meta.dirname, "../..");
const repoRoot = path.resolve(webDir, "../..");

describe("vite env config", () => {
  it("reads env from the repo root with the default VITE_ prefix", async () => {
    expect(JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")).name).toBe("rabbitqa");

    const loaded = await loadConfigFromFile(
      { command: "build", mode: "production" },
      path.join(webDir, "vite.config.ts"),
      webDir,
    );

    expect(loaded).not.toBeNull();
    expect(loaded!.config.envDir).toBe(repoRoot);
    expect(loaded!.config.envPrefix).toBeUndefined();
  });
});
