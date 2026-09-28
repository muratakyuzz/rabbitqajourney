export interface ApiSuccess<T> {
  data: T;
  meta: Record<string, unknown>;
}

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: unknown[];
  };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

function resolveError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return { message: fallback, code: undefined as string | undefined };
  }

  const parsed = payload as ApiErrorPayload;
  return {
    message: parsed.error?.message ?? fallback,
    code: parsed.error?.code,
  };
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };

  if (!headers["Content-Type"] && init.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const resolved = resolveError(payload, `Request failed (${response.status})`);
    throw new ApiClientError(resolved.message, response.status, resolved.code);
  }

  const body = payload as ApiSuccess<T>;
  return body.data;
}
