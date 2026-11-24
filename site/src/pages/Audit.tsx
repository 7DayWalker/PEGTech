/**
 * AI Revenue-Leak Audit calculator page.
 */
import { useState } from "react"
import { useTitle } from "../lib/useTitle"
import { api } from "../lib/api"
import { useToast } from "../lib/Toast"
import { ChatWidget } from "../components/ChatWidget"
import { AlertTriangle, DollarSign, Clock, BarChart3 } from "lucide-react"

const LEAD_BANDS = ["Under 50", "50 – 150", "150 – 400", "400+"]
const RESPONSE_TIMES = ["Under 5 mins", "Under 1 hour", "Same day", "Next day +"]
const PIPELINES = ["CRM / system", "Spreadsheet", "Inbox / DMs only", "Nothing structured"]
const DEAL_BANDS = ["Under $250", "$250 – $1,500", "$1,500 – $6,000", "$6,000+"]

export function Audit() {
  useTitle("AI Revenue-Leak Audit — PEGTech")
  const { show } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [form] = useState({
    industry: "Marketing Agency",
    leads: LEAD_BANDS[1],
    response: RESPONSE_TIMES[2],
    pipeline: PIPELINES[1],
    deal: DEAL_BANDS[2],
    email: "",
  })

  async function runAudit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/api/public/audit", form)
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      }
    } catch {
      show("Audit calculation failed. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  if (!result) {
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
          <div className="max-w-3xl mx-auto">
            <div className="card p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-accent" />
                <h1 className="text-2xl font-bold text-text">AI Revenue-Leak Audit</h1>
              </div>
              <p className="text-muted mb-6">
                Answer 5 questions to estimate how much revenue your business is losing
                to slow response times, poor pipeline, and ad waste.
              </p>
              <form onSubmit={runAudit} className="space-y-5">
                <div className="space-y-2">
                  <label className="label">Your industry</label>
                  <input
                    className="input"
                    value={form.industry}
                    onChange={(e) => { form.industry = e.target.value }}
                    placeholder="e.g. Marketing Agency"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Monthly leads</label>
                  <select className="input" value={form.leads} onChange={(e) => { form.leads = e.target.value }}>
                    {LEAD_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label">Average response time to leads</label>
                  <select className="input" value={form.response} onChange={(e) => { form.response = e.target.value }}>
                    {RESPONSE_TIMES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label">Lead pipeline / CRM</label>
                  <select className="input" value={form.pipeline} onChange={(e) => { form.pipeline = e.target.value }}>
                    {PIPELINES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label">Average deal size</label>
                  <select className="input" value={form.deal} onChange={(e) => { form.deal = e.target.value }}>
                    {DEAL_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label">Your email (optional, for report)</label>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => { form.email = e.target.value }}
                    placeholder="you@company.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn w-full py-3 disabled:opacity-50"
                >
                  {loading ? "Calculating…" : "Run Audit"}
                </button>
              </form>
            </div>
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
    </div>
  )
}

import { Link } from "react-router-dom"
