import { Router } from "express";
import { ActionCreateSchema, ActionPatchSchema } from "@rabbitqa/shared";
import type { Db } from "../../db";
import { createAction, listActions, updateAction } from "./actions.service";

/** Actions (API_CONTRACT #6, #7 + list). Mounted at /api. */
export function actionsRouter(db: Db) {
  const r = Router();
  r.get("/projects/:projectId/actions", async (req, res) => {
    res.json(await listActions(db, req.params.projectId));
  });
  r.post("/projects/:projectId/actions", async (req, res) => {
    res.status(201).json(await createAction(db, req.params.projectId, ActionCreateSchema.parse(req.body)));
  });
  r.patch("/actions/:id", async (req, res) => {
    res.json(await updateAction(db, req.params.id, ActionPatchSchema.parse(req.body)));
  });
  return r;
}
