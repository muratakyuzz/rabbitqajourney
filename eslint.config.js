import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// ADR-0007 K2, F0-04a D4 (b): current react-hooks `recommended`; rules-of-hooks stays an error,
// every other rule (exhaustive-deps and the React Compiler rules added in v6/v7) is a warning.
const reactHooksRecommended = reactHooks.configs.flat.recommended;
const reactHooksRules = Object.fromEntries(
  Object.keys(reactHooksRecommended.rules).map((rule) => [
    rule,
    rule === "react-hooks/rules-of-hooks" ? "error" : "warn",
  ]),
);

export default tseslint.config(
  { ignores: ["dist", "**/dist", ".verify", "coverage", "playwright-report", "test-results"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooksRecommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooksRules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // shadcn bileşenleri elle değiştirilmez (AGENTS.md §3); F0-02 D4, §14 (a)
    files: ["apps/web/src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "react-refresh/only-export-components": "off",
    },
  },
);
