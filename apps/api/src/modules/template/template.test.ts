import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { ApiErrorBodySchema, TemplateVersionSchema, type PhaseTpl } from "@rabbitqa/shared";
import { PHASE_TEMPLATE } from "@rabbitqa/shared/domain/seed";
import { createApp } from "../../app";
import { createDb, type Db } from "../../db";

let db: Db;
let app: ReturnType<typeof createApp>;
beforeEach(async () => {
  db = await createDb();
  app = createApp({ db, bootId: "b", startedAt: "" });
});

const tpl = (): PhaseTpl[] => structuredClone(PHASE_TEMPLATE);
const phaseIdx = (code: string) => PHASE_TEMPLATE.findIndex((p) => p.code === code);
const put = (phases: PhaseTpl[], baseVersion = 1) => request(app).put("/api/config/template").send({ baseVersion, phases });
const errorOf = (res: request.Response) => ApiErrorBodySchema.parse(res.body).error;

describe("GET /api/config/template", () => {
  it("returns the seed template as version 1", async () => {
    const res = await request(app).get("/api/config/template");
    expect(res.status).toBe(200);
    const v = TemplateVersionSchema.parse(res.body);
    expect(v.version).toBe(1);
    expect(v.createdBy).toBe("u_admin");
    expect(v.phases).toEqual(PHASE_TEMPLATE);
  });
});

describe("PUT /api/config/template", () => {
  it("creates version 2 with the edits; GET then returns it", async () => {
    const phases = tpl();
    const p06 = phases[phaseIdx("06")];
    p06.steps.push({ title: "Yeni adım", ball: "csm", required: false, dependency: "previous", durationDays: 4, completion: "manual" });
    p06.steps.reverse(); // reordering manual steps is allowed
    phases[phaseIdx("08")].steps.splice(0, 1); // deleting a manual step is allowed
    phases[1].name = "Kick-off (yeni)";

    const res = await put(phases);
    expect(res.status).toBe(201);
    const v = TemplateVersionSchema.parse(res.body);
    expect(v.version).toBe(2);
    expect(v.createdBy).toBe("u_admin");
    expect(v.phases[phaseIdx("06")].steps[0].title).toBe("Yeni adım");

    const after = TemplateVersionSchema.parse((await request(app).get("/api/config/template")).body);
    expect(after.version).toBe(2);
    expect(after.phases).toEqual(v.phases);
  });

  it("trims titles before saving", async () => {
    const phases = tpl();
    phases[phaseIdx("06")].steps[0].title = "  KPI  ";
    const v = TemplateVersionSchema.parse((await put(phases)).body);
    expect(v.phases[phaseIdx("06")].steps[0].title).toBe("KPI");
  });

  it("409 with field baseVersion when the template changed meanwhile", async () => {
    expect((await put(tpl(), 1)).status).toBe(201);
    const res = await put(tpl(), 1);
    expect(res.status).toBe(409);
    expect(errorOf(res)).toEqual({ code: "CONFLICT", message: "Şablon başka bir yerde değişti, sayfayı yenileyin.", field: "baseVersion" });
  });

  describe("system step protection (409)", () => {
    it("deleting a keyed step", async () => {
      const phases = tpl();
      phases[phaseIdx("07")].steps = phases[phaseIdx("07")].steps.filter((s) => s.key !== "gonogo");
      const res = await put(phases);
      expect(res.status).toBe(409);
      expect(errorOf(res).message).toContain("Go/No-Go toplantısı");
    });

    it("deleting a data-completed step", async () => {
      const phases = tpl();
      phases[0].steps = phases[0].steps.filter((s) => s.key !== "modules");
      expect((await put(phases)).status).toBe(409);
    });

    it("moving a system step to another phase", async () => {
      const phases = tpl();
      const [kpi] = phases[phaseIdx("02")].steps.splice(phases[phaseIdx("02")].steps.findIndex((s) => s.key === "kpi"), 1);
      phases[phaseIdx("06")].steps.push(kpi);
      expect((await put(phases)).status).toBe(409);
    });

    it("changing a system step's key or completion", async () => {
      const renamed = tpl();
      renamed[0].steps[0].key = "csm2";
      expect((await put(renamed)).status).toBe(409);

      const manual = tpl();
      manual[0].steps[0].completion = "manual";
      const res = await put(manual);
      expect(res.status).toBe(409);
      expect(errorOf(res).message).toContain("tamamlanma biçimi");
    });

    it("adding a new step that claims to be a system step", async () => {
      const phases = tpl();
      phases[phaseIdx("06")].steps.push({ title: "Sahte", ball: "csm", required: false, dependency: "previous", durationDays: 1, completion: "data" });
      expect((await put(phases)).status).toBe(409);
    });
  });

  describe("validation (400)", () => {
    const cases: [string, (p: PhaseTpl[]) => unknown, string][] = [
      ["empty step title", (p) => { p[phaseIdx("06")].steps[0].title = "   "; }, "phases.6.steps.0.title"],
      ["empty phase name", (p) => { p[2].name = ""; }, "phases.2.name"],
      ["durationDays 0", (p) => { p[phaseIdx("06")].steps[0].durationDays = 0; }, "phases.6.steps.0.durationDays"],
      ["durationDays 61", (p) => { p[phaseIdx("06")].steps[0].durationDays = 61; }, "phases.6.steps.0.durationDays"],
      ["durationDays 1.5", (p) => { p[phaseIdx("06")].steps[0].durationDays = 1.5; }, "phases.6.steps.0.durationDays"],
      ["phase removed", (p) => { p.pop(); }, "phases"],
      ["phases reordered", (p) => { [p[1], p[2]] = [p[2], p[1]]; }, "phases"],
      ["first phase dependency changed", (p) => { p[0].dependency = "independent"; }, "phases.0.dependency"],
      ["step added to 05", (p) => { p[phaseIdx("05")].steps.push({ title: "Ek", ball: "csm", required: false, dependency: "previous", durationDays: 1 }); }, "phases.5.steps"],
      ["duplicate key", (p) => { p[phaseIdx("06")].steps[0].key = "csm"; }, "phases.6.steps.0.key"],
    ];
    it.each(cases)("%s", async (_name, edit, field) => {
      const phases = tpl();
      edit(phases);
      const res = await put(phases);
      expect(res.status).toBe(400);
      expect(errorOf(res)).toMatchObject({ code: "VALIDATION", field });
      expect(errorOf(res).message).not.toBe("");
    });

    it("missing baseVersion", async () => {
      const res = await request(app).put("/api/config/template").send({ phases: tpl() });
      expect(res.status).toBe(400);
      expect(errorOf(res).field).toBe("baseVersion");
    });
  });

  it("a rejected PUT leaves the active version unchanged", async () => {
    const phases = tpl();
    phases[0].steps = [];
    expect((await put(phases)).status).toBe(409);
    const v = TemplateVersionSchema.parse((await request(app).get("/api/config/template")).body);
    expect(v.version).toBe(1);
    expect(v.phases).toEqual(PHASE_TEMPLATE);
  });
});
