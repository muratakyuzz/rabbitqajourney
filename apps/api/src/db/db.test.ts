import { beforeAll, describe, expect, it } from "vitest";
import { createSeed } from "@rabbitqa/shared/domain/seed";
import { createDb, expandEnums, type Db } from "./index";

const seed = createSeed();
let db: Db;
beforeAll(async () => {
  db = await createDb(seed);
});

const count = async (table: string) => Number((await db.query<{ n: number }>(`SELECT count(*) AS n FROM ${table}`)).rows[0].n);

describe("createDb", () => {
  it("loads the shared seed into every table", async () => {
    expect(await count("users")).toBe(seed.users.length);
    expect(await count("projects")).toBe(seed.projects.length);
    expect(await count("phases")).toBe(seed.phases.length);
    expect(await count("steps")).toBe(seed.steps.length);
    expect(await count("actions")).toBe(seed.actions.length);
    expect(await count("meetings")).toBe(seed.meetings.length);
    expect(await count("meeting_participants")).toBe(seed.meetings.reduce((n, m) => n + m.internalIds.length + m.contactIds.length, 0));
    expect(await count("template_versions")).toBe(1);
  });

  it("keeps the seed ids (web and API share them)", async () => {
    const step = seed.steps[0];
    const { rows } = await db.query<{ id: string; phase_id: string; status: string }>("SELECT id, phase_id, status FROM steps WHERE id = $1", [step.id]);
    expect(rows).toEqual([{ id: step.id, phase_id: step.phaseId, status: step.status }]);
  });

  it("stores the template as PhaseTpl[] in version 1", async () => {
    const { rows } = await db.query<{ phases: unknown }>("SELECT phases FROM template_versions WHERE version = 1");
    expect(rows[0].phases).toEqual(seed.template);
  });

  it("rejects values outside the shared enums", async () => {
    await expect(db.query("UPDATE steps SET status = 'bogus' WHERE id = $1", [seed.steps[0].id])).rejects.toThrow();
  });

  it("starts from the seed again on a new boot", async () => {
    await db.query("DELETE FROM meeting_participants");
    const fresh = await createDb(seed);
    expect(Number((await fresh.query<{ n: number }>("SELECT count(*) AS n FROM meeting_participants")).rows[0].n)).toBeGreaterThan(0);
  });
});

describe("db.transaction", () => {
  it("rolls back every write when the callback throws", async () => {
    const before = await count("actions");
    await expect(db.transaction(async (tx) => {
      await tx.query(
        "INSERT INTO actions (id, project_id, title, ball, priority, status, source) VALUES ('a_tx', $1, 'x', 'csm', 'medium', 'open', 'manual')",
        [seed.projects[0].id],
      );
      throw new Error("boom");
    })).rejects.toThrow("boom");
    expect(await count("actions")).toBe(before);
  });

  it("keeps committed writes and the queue keeps working after a failure", async () => {
    const title = async () => (await db.query<{ title: string }>("SELECT title FROM actions WHERE id = $1", [seed.actions[0].id])).rows[0].title;
    await db.transaction((tx) => tx.query("UPDATE actions SET title = 'committed' WHERE id = $1", [seed.actions[0].id]));
    await expect(db.transaction(async () => { throw new Error("x"); })).rejects.toThrow();
    expect(await title()).toBe("committed");
  });

  it("runs transactions one at a time", async () => {
    const order: string[] = [];
    const slow = db.transaction(async () => {
      order.push("a:start");
      await new Promise((r) => setTimeout(r, 20));
      order.push("a:end");
    });
    const fast = db.transaction(async () => {
      order.push("b");
    });
    await Promise.all([slow, fast]);
    expect(order).toEqual(["a:start", "a:end", "b"]);
  });
});

describe("expandEnums", () => {
  it("expands {{Name}} from the shared NameSchema", () => {
    expect(expandEnums("x IN ({{Role}})")).toBe("x IN ('csm', 'devops', 'care', 'manager', 'admin')");
  });

  it("fails on an unknown enum", () => {
    expect(() => expandEnums("{{Nope}}")).toThrow("unknown enum");
  });
});
