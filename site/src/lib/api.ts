/**
 * API client for PEGTech frontend.
 * Uses fetch with automatic JWT from HttpOnly cookie (set by /api/auth/login).
 */
const API_BASE = import.meta.env.VITE_API_URL || ""

async function request(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> || {}),
  }

  const res = await fetch(`${API_BASE}${input}`, {
    ...init,
    headers,
    credentials: "include", // send HttpOnly cookie
  })

  if (res.status === 401) {
    window.location.href = "/signin"
  }

  return res
}

export const api = {
  get: (path: string, init?: RequestInit) =>
    request(path, { ...init, method: "GET" }),
  post: (path: string, body?: unknown, init?: RequestInit) =>
    request(path, {
      ...init,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: (path: string, body?: unknown, init?: RequestInit) =>
    request(path, {
      ...init,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: (path: string, init?: RequestInit) =>
    request(path, { ...init, method: "DELETE" }),
}
