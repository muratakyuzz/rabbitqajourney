import express from "express";
import type { HealthResponse } from "@rabbitqa/shared";
import type { Db } from "./db";
import { errorHandler, notFound } from "./http/errors";

export interface AppDeps {
  db: Db;
  bootId: string;
  startedAt: string;
}

export function createApp({ bootId, startedAt }: AppDeps) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());

  const api = express.Router();
  api.get("/health", (_req, res) => {
    const body: HealthResponse = { status: "ok", bootId, startedAt };
    res.json(body);
  });

  app.use("/api", api);
  app.use("/api", () => {
    throw notFound("Uç bulunamadı.");
  });
  app.use(errorHandler);
  return app;
}
