import { Router } from "express";
import { PhasePatchSchema, ProjectCreateSchema, StepPatchSchema, StepsSyncSchema } from "@rabbitqa/shared";
import type { Db } from "../../db";
import { completePhase, createProject, listPhases, syncSteps, updatePhase, updateStep } from "./projects.service";

/** Projects, phases and steps (API_CONTRACT #1, #3, #4, #5 + client-rule bridge). Mounted at /api. */
export function projectsRouter(db: Db) {
  const r = Router();
  r.post("/projects", async (req, res) => {
    res.status(201).json(await createProject(db, ProjectCreateSchema.parse(req.body)));
  });
  r.get("/projects/:projectId/phases", async (req, res) => {
    res.json(await listPhases(db, req.params.projectId));
  });
  r.post("/projects/:projectId/steps/sync", async (req, res) => {
    res.json(await syncSteps(db, req.params.projectId, StepsSyncSchema.parse(req.body).steps));
  });
  r.patch("/phases/:id", async (req, res) => {
    res.json(await updatePhase(db, req.params.id, PhasePatchSchema.parse(req.body)));
  });
  r.post("/phases/:id/complete", async (req, res) => {
    res.json(await completePhase(db, req.params.id));
  });
  r.patch("/steps/:id", async (req, res) => {
    res.json(await updateStep(db, req.params.id, StepPatchSchema.parse(req.body)));
  });
  return r;
}
