/**
 * Admin portal — staff dashboard with stats and quick actions.
 */
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTitle } from "../lib/useTitle"
import { api } from "../lib/api"
import { useToast } from "../lib/Toast"
import { ChatWidget } from "../components/ChatWidget"
import { Users, Folder, Mail, BarChart3, AlertTriangle, Clock } from "lucide-react"

export function AdminPortal() {
  useTitle("Admin Portal — PEGTech")
  const navigate = useNavigate()
  const { show } = useToast()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/api/admin/stats").then(async (res) => {
      if (res.ok) setStats(await res.json())
      setLoading(false)
    }).catch(() => {
      navigate("/signin")
      setLoading(false)
    })
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (!stats) {
    navigate("/signin")
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="text-accent">P</span>EG<span className="text-primary">Tech</span>
            </Link>
            <div className="ml-auto flex items-center gap-4 text-sm">
              <Link to="/admin/clients" className="text-muted hover:text-accent transition-colors">Clients</Link>
              <Link to="/admin/projects" className="text-muted hover:text-accent transition-colors">Projects</Link>
              <Link to="/admin/leads" className="text-muted hover:text-accent transition-colors">Leads</Link>
              <Link to="/" className="text-muted hover:text-accent transition-colors flex items-center gap-2">
                <LogOut2 size={16} /> Sign out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-text">Admin Portal</h1>
              <p className="text-muted">Manage your agency operations</p>
            </div>
            <Link to="/admin/clients" className="btn">+ New Client</Link>
          </div>

          {/* Stats cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Clients", value: stats.total_clients, icon: <Users size={20} />, color: "text-blue-600" },
              { label: "Projects", value: stats.total_projects, icon: <Folder size={20} />, color: "text-green-600" },
              { label: "Leads", value: stats.total_leads, icon: <Mail size={20} />, color: "text-purple-600" },
              { label: "Escalations", value: stats.pending_escalations, icon: <AlertTriangle size={20} />, color: "text-orange-600" },
            ].map((stat) => (
              <div key={stat.label} className="card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-8 h-8 rounded bg-muted/50 flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
                  <span className="text-muted text-xs">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-text">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-text mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <Link to="/admin/clients" className="p-4 rounded-lg border border-input hover:bg-muted/50 transition-colors text-center">
                <Users size={24} className="mx-auto mb-2 text-muted" />
                <p className="text-sm font-medium text-text">Manage Clients</p>
              </Link>
              <Link to="/admin/projects" className="p-4 rounded-lg border border-input hover:bg-muted/50 transition-colors text-center">
                <Folder size={24} className="mx-auto mb-2 text-muted" />
                <p className="text-sm font-medium text-text">Manage Projects</p>
              </Link>
              <Link to="/admin/leads" className="p-4 rounded-lg border border-input hover:bg-muted/50 transition-colors text-center">
                <Mail size={24} className="mx-auto mb-2 text-muted" />
                <p className="text-sm font-medium text-text">Manage Leads</p>
              </Link>
              <Link to="/audit" className="p-4 rounded-lg border border-input hover:bg-muted/50 transition-colors text-center">
                <BarChart3 size={24} className="mx-auto mb-2 text-muted" />
                <p className="text-sm font-medium text-text">Run AI Audit</p>
              </Link>
            </div>
          </div>

          {/* Escalations alert */}
          {stats.pending_escalations > 0 && (
            <div className="card p-4 border-l-4 border-orange-500 bg-orange-50/50 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-800">Pending Escalations</h4>
                  <p className="text-sm text-orange-700">
                    You have {stats.pending_escalations} escalation(s) waiting for attention.
                  </p>
                </div>
              </div>
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

import { LogOut2 } from "lucide-react"
