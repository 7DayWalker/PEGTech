/**
 * Sign in page — staff and client login.
 */
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useTitle } from "../lib/useTitle"
import { api } from "../lib/api"
import { useToast } from "../lib/Toast"
import { ChatWidget } from "../components/ChatWidget"
import { Mail, Lock, User, LogIn } from "lucide-react"

export function SignIn() {
  useTitle("Sign in — PEGTech")
  const navigate = useNavigate()
  const { show } = useToast()
  const [form] = useState({ email: "", password: "" })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post("/api/auth/login", {
        email: form.email,
        password: form.password,
      })
      if (res.ok) {
        const data = await res.json()
        if (data.typ === "staff") {
          navigate("/admin")
        } else {
          navigate("/client-portal")
        }
      } else {
        const data = await res.json()
        show(data.detail || "Login failed", "error")
      }
    } catch {
      show("Login failed. Please try again.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 px-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight justify-center text-text">
            <span className="text-accent">P</span>EG<span className="text-text">Tech</span>
          </div>
          <p className="text-muted text-sm mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <Mail size={18} className="text-muted" />
              Email
            </label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => { form.email = e.target.value }}
              placeholder="you@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <Lock size={18} className="text-muted" />
              Password
            </label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => { form.password = e.target.value }}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn size={18} /> {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New to PEGTech?{" "}
          <Link to="/signup" className="text-accent hover:underline font-medium">Request access</Link>
        </p>
      </div>

      <ChatWidget />
    </div>
  )
}
