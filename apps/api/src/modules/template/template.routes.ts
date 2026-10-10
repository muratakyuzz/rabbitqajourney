import { Router } from "express";
import { TemplatePutSchema, type TemplateVersion } from "@rabbitqa/shared";
import type { Db } from "../../db";
import { currentUserId } from "../../core/current-user";
import { HttpError, notFound } from "../../http/errors";
import { findActive, insertVersion } from "./template.repository";
import { checkTemplateChange } from "./template.rules";

/** Mounted at /api/config/template. A change creates a new version; existing projects keep their copy. */
export function templateRouter(db: Db) {
  const r = Router();

  r.get("/", async (_req, res) => {
    const active = await findActive(db);
    if (!active) throw notFound("Şablon bulunamadı.");
    res.json(active satisfies TemplateVersion);
  });

  r.put("/", async (req, res) => {
    const body = TemplatePutSchema.parse(req.body);
    const created = await db.transaction(async (tx) => {
      const active = await findActive(tx);
      if (!active) throw notFound("Şablon bulunamadı.");
      if (body.baseVersion !== active.version) {
        // field "baseVersion" lets the client offer "Yenile" for this conflict only
        throw new HttpError(409, "CONFLICT", "Şablon başka bir yerde değişti, sayfayı yenileyin.", "baseVersion");
      }
      const violation = checkTemplateChange(active.phases, body.phases);
      if (violation) throw violation;
      return insertVersion(tx, { version: active.version + 1, phases: body.phases, createdBy: await currentUserId(tx) });
    });
    res.status(201).json(created satisfies TemplateVersion);
  });

  return r;
}
