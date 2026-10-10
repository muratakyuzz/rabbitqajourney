import type { ErrorRequestHandler } from "express";
import { z } from "zod";
import type { ApiErrorBody, ApiErrorCode } from "@rabbitqa/shared";

// Default zod messages in Turkish; schemas in @rabbitqa/shared override them where it matters.
z.config(z.locales.tr());

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

export const notFound = (message = "Kayıt bulunamadı.") => new HttpError(404, "NOT_FOUND", message);
export const conflict = (message: string) => new HttpError(409, "CONFLICT", message);
export const badRequest = (message: string, field?: string) => new HttpError(400, "VALIDATION", message, field);
export const reasonRequired = (field = "reason") => new HttpError(400, "REASON_REQUIRED", "Gerekçe zorunludur.", field);

interface ZodLikeError { name: "ZodError"; issues: { path: PropertyKey[]; message: string }[] }
const isZodError = (e: unknown): e is ZodLikeError =>
  e instanceof Error && e.name === "ZodError" && Array.isArray((e as Partial<ZodLikeError>).issues);

/** Single error shape: `{ error: { code, message, field? } }`. Unknown errors become 500 without leaking details. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let body: ApiErrorBody = { error: { code: "INTERNAL", message: "Beklenmeyen bir hata oluştu." } };
  if (err instanceof HttpError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message, ...(err.field ? { field: err.field } : {}) } };
  } else if (isZodError(err)) {
    status = 400;
    const issue = err.issues[0];
    const field = issue?.path.map(String).join(".");
    body = { error: { code: "VALIDATION", message: issue?.message || "Geçersiz istek.", ...(field ? { field } : {}) } };
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    body = { error: { code: "VALIDATION", message: "İstek gövdesi geçerli JSON değil." } };
  } else {
    console.error(err);
  }
  res.status(status).json(body);
};
