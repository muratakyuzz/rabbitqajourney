import type { z } from "zod";
import { ApiErrorBodySchema, type ApiErrorCode } from "@rabbitqa/shared";

// Thin fetch wrapper for /api (Vite proxies it to the API in dev). Every failure becomes an ApiError
// whose message is Turkish and safe to show in a toast.

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode | "NETWORK",
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiOptions<T> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Parses the success body; a mismatch throws (contract drift should be loud). */
  schema?: z.ZodType<T>;
  signal?: AbortSignal;
}

export async function api<T = unknown>(path: string, { method = "GET", body, schema, signal }: ApiOptions<T> = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Sunucuya ulaşılamıyor.");
  }
  const data: unknown = res.status === 204 ? undefined : await res.json().catch(() => undefined);
  if (!res.ok) {
    const parsed = ApiErrorBodySchema.safeParse(data);
    if (parsed.success) {
      const { code, message, field } = parsed.data.error;
      throw new ApiError(res.status, code, message, field);
    }
    throw new ApiError(res.status, "INTERNAL", "Beklenmeyen bir hata oluştu.");
  }
  return schema ? schema.parse(data) : (data as T);
}

/** Message for a toast from anything an API call may throw. */
export function apiErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Beklenmeyen bir hata oluştu.";
}
