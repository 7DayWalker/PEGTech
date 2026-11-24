/**
 * Client portal — client users view their projects, deliverables, updates.
 */
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTitle } from "../lib/useTitle"
import { api } from "../lib/api"
import { ChatWidget } from "../components/ChatWidget"
import { Folder, FileText, Clock, File } from "lucide-react"

export function ClientPortal() {
  useTitle("Client Portal — PEGTech")
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/api/clients/me").then(async (res) => {
      if (res.ok) setData(await res.json())
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

  if (!data) {
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
              <span className="text-muted">{data.client?.company || "Client"}</span>
              <Link to="/" className="text-muted hover:text-accent transition-colors flex items-center gap-2">
                <LogOut size={16} /> Sign out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-text">Client Portal</h1>
              <p className="text-muted">{data.client?.company}</p>
            </div>
            <Link to="/book" className="btn">New Request</Link>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Projects", value: data.projects?.length || 0, icon: <Folder size={20} />, color: "text-blue-600" },
              { label: "Deliverables", value: data.deliverables?.length || 0, icon: <File size={20} />, color: "text-green-600" },
              { label: "Updates", value: data.updates?.length || 0, icon: <Clock size={20} />, color: "text-purple-600" },
              { label: "Documents", value: data.documents?.length || 0, icon: <FileText size={20} />, color: "text-orange-600" },
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

          {/* Recent updates */}
          <div className="card p-6 mb-8">
            <h3 className="text-lg font-bold text-text mb-4">Recent Updates</h3>
            {data.updates?.length ? (
              <ul className="space-y-4">
                {data.updates.map((u: any) => (
                  <li key={u.id} className="pb-4 border-b border-input last:border-0">
                    <div className="flex justify-between">
                      <span className="font-medium text-text">{u.headline}</span>
                      <span className="text-xs text-muted">{u.week_label}</span>
                    </div>
                    <p className="text-sm text-muted">{u.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No updates yet.</p>
            )}
          </div>

          {/* Deliverables */}
          <div className="card p-6 mb-8">
            <h3 className="text-lg font-bold text-text mb-4">Deliverables</h3>
            {data.deliverables?.length ? (
              <ul className="space-y-3">
                {data.deliverables.map((d: any) => (
                  <li key={d.id} className="flex items-center justify-between p-3 rounded-md border border-input hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <File size={18} className="text-muted" />
                      <span className="text-sm text-text">{d.title}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      d.status === "done" ? "bg-green-100 text-green-700" :
                      d.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                      d.status === "review" ? "bg-yellow-100 text-yellow-700" :
                      "bg-muted/50 text-muted"
                    }`}>
                      {d.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No deliverables yet.</p>
            )}
          </div>

          {/* Messages */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-text mb-4">Messages</h3>
            {data.messages?.length ? (
              <ul className="space-y-4">
                {data.messages.map((m: any) => (
                  <li key={m.id} className="p-3 rounded-md border border-input">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-text">{m.author}</span>
                      <span className="text-xs text-muted">{m.sender}</span>
                    </div>
                    <p className="text-sm text-muted">{m.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No messages yet.</p>
            )}
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
  )
}

import { LogOut } from "lucide-react"
