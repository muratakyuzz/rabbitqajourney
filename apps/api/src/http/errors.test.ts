import { describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";
import { ApiErrorBodySchema } from "@rabbitqa/shared";
import { conflict, errorHandler, reasonRequired } from "./errors";

function appThrowing(err: unknown) {
  const app = express();
  app.get("/x", async () => {
    throw err;
  });
  app.use(errorHandler);
  return app;
}

describe("errorHandler", () => {
  it("HttpError keeps status, code, message and field", async () => {
    const res = await request(appThrowing(reasonRequired())).get("/x");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: "REASON_REQUIRED", message: "Gerekçe zorunludur.", field: "reason" } });
  });

  it("409 CONFLICT without field", async () => {
    const res = await request(appThrowing(conflict("Adımın sırası gelmedi"))).get("/x");
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { code: "CONFLICT", message: "Adımın sırası gelmedi" } });
  });

  it("ZodError → 400 VALIDATION with the first failing field path", async () => {
    const parsed = z.object({ phase: z.object({ planEnd: z.string() }) }).safeParse({ phase: { planEnd: 1 } });
    const res = await request(appThrowing(parsed.error)).get("/x");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: "VALIDATION", message: "Geçersiz istek.", field: "phase.planEnd" } });
  });

  it("unknown error → 500 INTERNAL without leaking the message", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(appThrowing(new Error("db password is hunter2"))).get("/x");
    spy.mockRestore();
    expect(res.status).toBe(500);
    expect(ApiErrorBodySchema.parse(res.body).error.code).toBe("INTERNAL");
    expect(JSON.stringify(res.body)).not.toContain("hunter2");
  });
});
