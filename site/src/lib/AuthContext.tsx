/**
 * Shared auth state for the whole app.
 *
 * Before this existed, each page guessed at auth state independently —
 * Nav always hardcoded "Sign in" regardless of session, and AdminPortal
 * conflated "is the user logged in" with "did this one stats API call
 * succeed," which meant a single hiccup on /api/admin/stats looked exactly
 * like an expired session. This hydrates once from whatever token is
 * already stored (so a page refresh or a brand-new tab restores the
 * session via /api/auth/whoami), and every page reads the same `user`
 * value — so Nav, SignIn, and the dashboard always agree.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react"
import { api, setAuthToken, clearAuthToken, hasAuthToken, UNAUTHORIZED_EVENT } from "./api"

export type AuthUser = {
  typ: "staff" | "client"
  role: string
  name: string
  email: string
  client_id?: number | null
}

type AuthContextType = {
  user: AuthUser | null
  /** True only during the initial session-restore check on first load. */
  initializing: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      if (!hasAuthToken()) {
        if (!cancelled) setInitializing(false)
        return
      }
      try {
        const res = await api.get("/api/auth/whoami")
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json()
            setUser({
              typ: data.typ,
              role: data.role,
              name: data.name,
              email: data.email,
              client_id: data.client_id,
            })
          } else {
            setUser(null)
          }
        }
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }

    hydrate()

    const onUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => {
      cancelled = true
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    }
  }, [])

  const login = useCallback((token: string, userData: AuthUser) => {
    setAuthToken(token)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    api.post("/api/auth/logout").catch(() => {
      // best-effort — the token is wiped locally regardless
    })
    clearAuthToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
