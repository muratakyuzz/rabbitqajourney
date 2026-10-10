import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { ApiErrorBodySchema, HealthResponseSchema } from "@rabbitqa/shared";
import { createApp } from "./app";
import { createDb, type Db } from "./db";

let db: Db;
beforeAll(async () => {
  db = await createDb();
});

describe("GET /api/health", () => {
  it("returns ok with the bootId of this process", async () => {
    const app = createApp({ db, bootId: "boot-1", startedAt: "2026-10-10T10:00:00.000Z" });
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(HealthResponseSchema.parse(res.body)).toEqual({ status: "ok", bootId: "boot-1", startedAt: "2026-10-10T10:00:00.000Z" });
  });

  it("reports a different bootId after a restart", async () => {
    const a = await request(createApp({ db, bootId: "boot-1", startedAt: "" })).get("/api/health");
    const b = await request(createApp({ db, bootId: "boot-2", startedAt: "" })).get("/api/health");
    expect(a.body.bootId).not.toBe(b.body.bootId);
  });
});

describe("error shape", () => {
  it("unknown /api route → 404 NOT_FOUND", async () => {
    const res = await request(createApp({ db, bootId: "b", startedAt: "" })).get("/api/nope");
    expect(res.status).toBe(404);
    expect(ApiErrorBodySchema.parse(res.body).error.code).toBe("NOT_FOUND");
  });

  it("malformed JSON body → 400 VALIDATION", async () => {
    const res = await request(createApp({ db, bootId: "b", startedAt: "" }))
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(ApiErrorBodySchema.parse(res.body).error.code).toBe("VALIDATION");
  });

  it("a body over the 100 kB limit → 413, not 500 (review D5)", async () => {
    const res = await request(createApp({ db, bootId: "b", startedAt: "" }))
      .post("/api/projects/p_garanti/actions")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ title: "x".repeat(200_000) }));
    expect(res.status).toBe(413);
    expect(ApiErrorBodySchema.parse(res.body).error).toEqual({ code: "VALIDATION", message: "İstek gövdesi çok büyük." });
  });

  it("an unsupported body charset → 415 VALIDATION, not 500", async () => {
    const res = await request(createApp({ db, bootId: "b", startedAt: "" }))
      .post("/api/projects/p_garanti/actions")
      .set("Content-Type", "application/json; charset=latin1")
      .send("{}");
    expect(res.status).toBe(415);
    expect(ApiErrorBodySchema.parse(res.body).error).toEqual({ code: "VALIDATION", message: "İstek gövdesi okunamadı." });
  });
});
