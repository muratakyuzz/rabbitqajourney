import express from "express";
import type { HealthResponse } from "@rabbitqa/shared";
import type { Db } from "./db";
import { errorHandler, notFound } from "./http/errors";
import { templateRouter } from "./modules/template/template.routes";
import { projectsRouter } from "./modules/projects/projects.routes";

export interface AppDeps {
  db: Db;
  bootId: string;
  startedAt: string;
}

export function createApp({ db, bootId, startedAt }: AppDeps) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());

  const api = express.Router();
  api.get("/health", (_req, res) => {
    const body: HealthResponse = { status: "ok", bootId, startedAt };
    res.json(body);
  });
  api.use("/config/template", templateRouter(db));
  api.use(projectsRouter(db));

  app.use("/api", api);
  app.use("/api", () => {
    throw notFound("Uç bulunamadı.");
  });
  app.use(errorHandler);
  return app;
}
