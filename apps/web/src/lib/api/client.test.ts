import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { api, ApiError, apiErrorMessage } from "./client";

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const mockFetch = (impl: () => Promise<Response>) => vi.stubGlobal("fetch", vi.fn(impl));

afterEach(() => vi.unstubAllGlobals());

describe("api", () => {
  it("prefixes /api, sends JSON and returns the parsed body", async () => {
    mockFetch(async () => json(200, { id: "x" }));
    const out = await api("/things", { method: "POST", body: { a: 1 }, schema: z.object({ id: z.string() }) });
    expect(out).toEqual({ id: "x" });
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/things");
    expect(init).toMatchObject({ method: "POST", body: '{"a":1}', headers: { "Content-Type": "application/json" } });
  });

  it("turns the error envelope into ApiError with code, message and field", async () => {
    mockFetch(async () => json(400, { error: { code: "REASON_REQUIRED", message: "Gerekçe zorunludur.", field: "reason" } }));
    const err = await api("/x").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 400, code: "REASON_REQUIRED", message: "Gerekçe zorunludur.", field: "reason" });
  });

  it("maps a non-envelope error body to INTERNAL", async () => {
    mockFetch(async () => new Response("<html>bad gateway</html>", { status: 502 }));
    await expect(api("/x")).rejects.toMatchObject({ status: 502, code: "INTERNAL", message: "Beklenmeyen bir hata oluştu." });
  });

  it("maps a network failure to NETWORK", async () => {
    mockFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(api("/x")).rejects.toMatchObject({ status: 0, code: "NETWORK", message: "Sunucuya ulaşılamıyor." });
  });

  it("a success body that breaks the schema → ApiError INVALID_RESPONSE with the field and the record id", async () => {
    mockFetch(async () => json(200, { items: [{ id: "a_1", title: "ok" }, { id: "a_2", title: "" }] }));
    const schema = z.object({ items: z.array(z.object({ id: z.string(), title: z.string().min(1) })) });
    const err = await api("/x", { schema }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 200, code: "INVALID_RESPONSE", field: "items.1.title" });
    expect((err as ApiError).message).toBe("Sunucu yanıtı beklenen biçimde değil (items.1.title).");
    expect((err as ApiError).detail).toMatch(/^items\.1\.title — .+ \(id a_2\)$/);
  });

  it("apiErrorMessage shows ApiError messages and hides anything else", () => {
    expect(apiErrorMessage(new ApiError(409, "CONFLICT", "Adımın sırası gelmedi"))).toBe("Adımın sırası gelmedi");
    expect(apiErrorMessage(new Error("stack trace"))).toBe("Beklenmeyen bir hata oluştu.");
  });
});
