import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STATE_KEY } from "@rabbitqa/shared/domain/seed";
import { BOOT_ID_KEY, syncBootId } from "./boot";

const health = (bootId: string) => vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ status: "ok", bootId, startedAt: "2026-10-10T10:00:00.000Z" }), { status: 200 })));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(STATE_KEY, '{"stale":true}');
  localStorage.setItem("rq-token", "keep-me");
});
afterEach(() => vi.unstubAllGlobals());

describe("syncBootId", () => {
  it("first contact with the API: clears the stored store and remembers the bootId", async () => {
    health("boot-1");
    expect(await syncBootId()).toBe("reset");
    expect(localStorage.getItem(STATE_KEY)).toBeNull();
    expect(localStorage.getItem(BOOT_ID_KEY)).toBe("boot-1");
  });

  it("API restarted (bootId changed): resets the store, keeps unrelated keys", async () => {
    localStorage.setItem(BOOT_ID_KEY, "boot-1");
    health("boot-2");
    expect(await syncBootId()).toBe("reset");
    expect(localStorage.getItem(STATE_KEY)).toBeNull();
    expect(localStorage.getItem(BOOT_ID_KEY)).toBe("boot-2");
    expect(localStorage.getItem("rq-token")).toBe("keep-me");
  });

  it("same boot: leaves the store alone", async () => {
    localStorage.setItem(BOOT_ID_KEY, "boot-1");
    health("boot-1");
    expect(await syncBootId()).toBe("same");
    expect(localStorage.getItem(STATE_KEY)).toBe('{"stale":true}');
  });

  it("API unreachable: offline, store untouched", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }));
    expect(await syncBootId()).toBe("offline");
    expect(localStorage.getItem(STATE_KEY)).toBe('{"stale":true}');
  });

  it("unexpected health body: offline, store untouched", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    expect(await syncBootId()).toBe("offline");
    expect(localStorage.getItem(STATE_KEY)).toBe('{"stale":true}');
  });
});
