// Low-level fetch wrapper. Points at n8n (or any HTTP backend) when configured.
// Falls back to a deterministic local mock so the UI is always usable.

export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export const N8N_WEBHOOK_URL =
  (import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined) ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE) {
    throw new ApiError("API base URL not configured", 0);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new ApiError(`Request failed: ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}
