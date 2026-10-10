// REV-04 (ADR-0007 K3): @rabbitqa/shared runs in web, API and worker alike, so the
// main tsconfig exposes neither DOM nor Node globals (lib ES2022, types []).
// Each reference below must stay a type error; if DOM is added to lib or node to
// types, the directive becomes unused and `npm run typecheck` fails.
// Not exported from src/index.ts.
export function noRuntimeGlobals(): unknown[] {
  return [
    // @ts-expect-error (REV-04) no DOM lib
    window,
    // @ts-expect-error (REV-04) no DOM lib
    document,
    // @ts-expect-error (REV-04) no Node types
    process,
  ];
}
