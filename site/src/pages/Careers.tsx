/**
 * Careers page — job listings and application form.
 */
import { useState } from "react"
import { useTitle } from "../lib/useTitle"
import { api } from "../lib/api"
import { useToast } from "../lib/Toast"
import { ChatWidget } from "../components/ChatWidget"

export function Careers() {
  useTitle("Careers — PEGTech")
  const { show } = useToast()
  const [roles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form] = useState({
    role_id: "", name: "", email: "", phone: "", experience: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/api/public/careers/apply", {
        role_id: parseInt(form.role_id),
        name: form.name,
        email: form.email,
        phone: form.phone,
        experience: form.experience,
      })
      if (res.ok) {
        const data = await res.json()
        show(`Application submitted!${data.flags?.length ? ` Flags: ${data.flags.join(", ")}` : ""}`, data.flags?.length ? "error" : "success")
      }
    } catch {
      show("Application failed. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="text-accent">P</span>EG<span className="text-primary">Tech</span>
            </Link>
            <Link to="/" className="text-muted hover:text-accent transition-colors">← Back to Home</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-accent font-bold">Join our team</span>
              <h1 className="text-2xl font-bold text-text">Careers at PEGTech</h1>
            </div>
            <p className="text-muted">We're building the future of client services. Help us shape it.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="card p-6">
                <h3 className="text-lg font-bold text-text">{role.role}</h3>
                <p className="text-sm text-muted mb-3">{role.meta || ""}</p>
                <p className="text-sm text-muted mb-4">{role.blurb || ""}</p>
                <button
                  onClick={() => { form.role_id = role.id.toString() }}
                  className="text-accent font-medium hover:underline"
                >
                  Apply for this role →
                </button>
              </div>
            ))}
          </div>

          {form.role_id && (
            <div className="card p-8 mt-8">
              <h3 className="text-lg font-bold text-text mb-4">Apply</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="label">Full name</label>
                  <input className="input" value={form.name} onChange={(e) => { form.name = e.target.value }} required />
                </div>
                <div className="space-y-2">
                  <label className="label">Email</label>
                  <input type="email" className="input" value={form.email} onChange={(e) => { form.email = e.target.value }} required />
                </div>
                <div className="space-y-2">
                  <label className="label">Phone</label>
                  <input type="tel" className="input" value={form.phone} onChange={(e) => { form.phone = e.target.value }} required />
                </div>
                <div className="space-y-2">
                  <label className="label">Experience</label>
                  <textarea className="input" rows={4} value={form.experience} onChange={(e) => { form.experience = e.target.value }} required />
                </div>
                <button type="submit" disabled={loading} className="btn w-full py-3 disabled:opacity-50">
                  {loading ? "Submitting…" : "Submit Application"}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-input bg-primary text-muted mt-auto pt-10 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <p className="mt-4 text-xs text-muted/60 text-center">
            © {new Date().getFullYear()} PEGTech. Built for modern businesses.
          </p>
        </div>
      </footer>

      <ChatWidget />
    </div>
  )
}

import { Link } from "react-router-dom"
