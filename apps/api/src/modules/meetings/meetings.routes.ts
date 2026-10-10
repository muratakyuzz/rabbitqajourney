import { Router } from "express";
import { MeetingCreateSchema, MeetingPatchSchema } from "@rabbitqa/shared";
import type { Db } from "../../db";
import { createMeeting, listMeetings, updateMeeting } from "./meetings.service";

/** Meetings (API_CONTRACT #8, #19 + list). Mounted at /api. */
export function meetingsRouter(db: Db) {
  const r = Router();
  r.get("/projects/:projectId/meetings", async (req, res) => {
    res.json(await listMeetings(db, req.params.projectId));
  });
  r.post("/projects/:projectId/meetings", async (req, res) => {
    res.status(201).json(await createMeeting(db, req.params.projectId, MeetingCreateSchema.parse(req.body)));
  });
  r.patch("/meetings/:id", async (req, res) => {
    res.json(await updateMeeting(db, req.params.id, MeetingPatchSchema.parse(req.body)));
  });
  return r;
}
