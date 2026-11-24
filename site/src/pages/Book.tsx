/**
 * Booking page — schedule a consultation.
 */
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTitle } from "../lib/useTitle"
import { api } from "../lib/api"
import { useToast } from "../lib/Toast"
import { Calendar, Phone, Mail, Clock } from "lucide-react"
import { ChatWidget } from "../components/ChatWidget"

const SLOTS = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"]

export function Book() {
  useTitle("Book a Call — PEGTech")
  const navigate = useNavigate()
  const { show } = useToast()
  const [form] = useState({
    name: "", email: "", phone: "", service: "", day: "", slot: "",
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post("/api/public/bookings", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        day: form.day,
        slot: form.slot,
        service: form.service,
      })
      if (res.ok) {
        show("Booking confirmed! We'll send a confirmation email shortly.", "success")
        navigate("/")
      }
    } catch {
      show("Failed to book. Please try again.", "error")
    } finally {
      setSubmitting(false)
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
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 mb-8">
            <h1 className="text-2xl font-bold text-text mb-2">Book a Consultation</h1>
            <p className="text-muted">Schedule a 30-minute discovery call with our team.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Full name</label>
                <input
                  className="input"
                  placeholder="Jane Doe"
                  onChange={(e) => { form.name = e.target.value }}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="jane@company.com"
                  onChange={(e) => { form.email = e.target.value }}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                placeholder="+1 (555) 000-0000"
                onChange={(e) => { form.phone = e.target.value }}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="label">Service of interest</label>
              <select
                className="input"
                onChange={(e) => { form.service = e.target.value }}
              >
                <option value="">Select a service</option>
                <option value="Web Development">Web Development</option>
                <option value="AI Solutions">AI Solutions</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Brand & Design">Brand & Design</option>
                <option value="Tech Consulting">Tech Consulting</option>
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Preferred date</label>
                <input
                  type="date"
                  className="input"
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => { form.day = e.target.value }}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="label">Preferred time</label>
                <select
                  className="input"
                  onChange={(e) => { form.slot = e.target.value }}
                >
                  <option value="">Select a time</option>
                  {SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn w-full py-3 disabled:opacity-50"
            >
              {submitting ? "Booking…" : "Confirm Booking"}
            </button>
          </form>
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
