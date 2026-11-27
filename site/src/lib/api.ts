/**
 * API client for PEGTech frontend.
 *
 * Auth token storage, in order of reliability:
 *  1. An in-memory module variable — a plain JS variable has no dependency
 *     on browser storage/cookie permissions at all. It survives for as
 *     long as this JS execution context is alive, which covers the normal
 *     SPA flow (login -> client-side route change to /admin, no full page
 *     reload). This is the PRIMARY store and what the app actually relies
 *     on inside a sandboxed/third-party preview iframe.
 *  2. localStorage — a best-effort secondary store so a hard page reload
 *     (typing the URL, hitting refresh) still restores the session when
 *     storage access is actually available (real browsers, production).
 *     In a sandboxed iframe with an opaque origin (no `allow-same-origin`),
 *     *all* storage AND cookies are unavailable or silently no-op — that's
 *     exactly the scenario the in-memory variable above is there to cover.
 *  3. HttpOnly session cookie (set by /api/auth/login) — extra belt & braces
 *    for same-origin production deployments (Railway serves frontend + API
 *    from one origin, so cookies work normally there).
 *
 * Transport: the token is sent as a custom `X-Pegtech-Auth` header (NOT the
 * standard `Authorization` header). Some reverse-proxy layers in front of
 * this app — notably sandboxed live-preview hosting — strip standard
 * `Authorization` and `Cookie` headers from every request outright, before
 * they ever reach this server, regardless of their value. A custom header
 * name is left untouched by that layer, so it's the one actually relied on
 * here; `Authorization` is still sent too as a harmless bonus for plain
 * same-origin production deployments that don't sit behind such a proxy.
 */
const API_BASE = (import.meta as any).env.VITE_API_URL || ""
const TOKEN_KEY = "pegtech_token"

let memoryToken: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
})()

export function setAuthToken(token: string) {
  memoryToken = token
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // storage blocked (opaque-origin sandboxed iframe, private mode, etc.) —
    // the in-memory copy above is what actually keeps the session alive here
  }
}

export function clearAuthToken() {
  memoryToken = null
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

function getAuthToken(): string | null {
  return memoryToken
}

export function hasAuthToken(): boolean {
  return memoryToken !== null
}

/** Builds a URL for a stored media asset (image/audio/document attached to
 * a WhatsApp message) suitable for direct use in <img>/<audio>/<a> tags,
 * which can't attach a custom Authorization header — the token is passed
 * as a query param instead (the backend's auth dependency supports this
 * exact fallback for that reason). */
export function mediaUrl(mediaId: number): string {
  const token = getAuthToken()
  const qs = token ? `?access_token=${encodeURIComponent(token)}` : ""
  return `${API_BASE}/api/media/${mediaId}${qs}`
}

/** Uploads a file as multipart/form-data (e.g. a WhatsApp media attachment).
 * Deliberately bypasses `request()`'s JSON Content-Type default — the
 * browser must set its own multipart boundary header for FormData bodies. */
export async function uploadFile(path: string, file: File, fields?: Record<string, string>): Promise<Response> {
  const token = getAuthToken()
  const form = new FormData()
  form.append("file", file)
  if (fields) {
    for (const [k, v] of Object.entries(fields)) form.append(k, v)
  }
  const headers: Record<string, string> = token ? { "X-Pegtech-Auth": token, Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${API_BASE}${path}`, { method: "POST", body: form, headers, credentials: "include" })
  if (res.status === 401) {
    clearAuthToken()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }
  return res
}

/** Fired whenever a request comes back 401 — AuthContext listens for this
 * and clears its user state, which in turn drives any gated page to
 * (client-side) navigate away. Deliberately NOT a hard window.location
 * redirect: that nukes the whole SPA on every expired/invalid token, which
 * is jarring and throws away unrelated page state for no reason. */
export const UNAUTHORIZED_EVENT = "pegtech:unauthorized"

async function request(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token
      ? { "X-Pegtech-Auth": token, Authorization: `Bearer ${token}` }
      : {}),
    ...(init?.headers as Record<string, string> || {}),
  }

  const res = await fetch(`${API_BASE}${input}`, {
    ...init,
    headers,
    credentials: "include", // also send HttpOnly cookie when available
  })

  if (res.status === 401) {
    clearAuthToken()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
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
