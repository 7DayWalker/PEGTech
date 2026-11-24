/** Client portal — client users view their projects, deliverables, updates. */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { api } from "../lib/api";
import { Card } from "../components/Card";
import { Container } from "../components/Section";
import { Badge } from "../components/Badge";
import { Folder, FileText, Clock, File, LogOut } from "lucide-react";

export function ClientPortal() {
  useTitle("Client Portal — PEGTech");
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/clients/me").then(async (res) => {
      if (res.ok) setData(await res.json());
      setLoading(false);
    }).catch(() => {
      navigate("/signin");
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!data) {
    navigate("/signin");
    return null;
  }

  const stats = [
    {
      label: "Projects",
      value: data.projects?.length || 0,
      icon: Folder,
      color: "text-blue-400",
    },
    {
      label: "Deliverables",
      value: data.deliverables?.length || 0,
      icon: File,
      color: "text-green-400",
    },
    {
      label: "Updates",
      value: data.updates?.length || 0,
      icon: Clock,
      color: "text-purple-400",
    },
    {
      label: "Documents",
      value: data.documents?.length || 0,
      icon: FileText,
      color: "text-orange-400",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-dark-900/80 backdrop-blur-md">
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl tracking-tight"
            >
              <span className="text-accent">P</span>EG<span className="text-white">Tech</span>
            </Link>
            <div className="ml-auto flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-300">
                {data.client?.company || "Client"}
              </div>
              <button
                onClick={() => {
                  api.post("/api/auth/logout").catch(() => {});
                  window.location.href = "/";
                }}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        </Container>
      </nav>

      <main className="flex-1 py-8 px-4">
        <Container>
          <div className="flex justify-between items-start mb-8">
            <div>
              <Badge className="mb-3 inline-block">Client Portal</Badge>
              <h1 className="text-2xl font-bold text-slate-100 mb-1">
                Welcome back
              </h1>
              <p className="text-slate-400">{data.client?.company}</p>
            </div>
            <Link to="/book" className="btn variant-primary size-sm">
              New Request
            </Link>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                padding="md"
                className="group hover:bg-slate-800/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <span className="text-xs text-slate-400">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-slate-100">
                  {stat.value}
                </div>
              </Card>
            ))}
          </div>

          {/* Recent updates */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card padding="lg" className="col-span-lg:2">
              <div className="flex items-center gap-2 mb-6">
                <Clock size={20} className="text-purple-400" />
                <h3 className="text-lg font-bold text-slate-100">Recent Updates</h3>
              </div>
              {data.updates?.length ? (
                <ul className="space-y-5">
                  {data.updates.map((u: any) => (
                    <li key={u.id} className="pb-5 border-b border-border/50 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-slate-100">
                          {u.headline}
                        </span>
                        <span className="text-xs text-slate-500">
                          {u.week_label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{u.body}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">No updates yet.</p>
              )}
            </Card>

            <Card padding="lg">
              <div className="flex items-center gap-2 mb-6">
                <File size={20} className="text-green-400" />
                <h3 className="text-lg font-bold text-slate-100">Deliverables</h3>
              </div>
              {data.deliverables?.length ? (
                <ul className="space-y-3">
                  {data.deliverables.map((d: any) => (
                    <li key={d.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <File size={18} className="text-slate-500" />
                        <span className="text-sm text-slate-300">{d.title}</span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          d.status === "done"
                            ? "bg-green-500/10 text-green-400"
                            : d.status === "in_progress"
                            ? "bg-blue-500/10 text-blue-400"
                            : d.status === "review"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {d.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">No deliverables yet.</p>
              )}
            </Card>
          </div>

          {/* Messages */}
          <Card padding="lg" className="mt-8">
            <div className="flex items-center gap-2 mb-6">
              <FileText size={20} className="text-orange-400" />
              <h3 className="text-lg font-bold text-slate-100">Messages</h3>
            </div>
            {data.messages?.length ? (
              <ul className="space-y-4">
                {data.messages.map((m: any) => (
                  <li key={m.id} className="p-4 rounded-xl border border-border/50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold text-slate-100">
                        {m.author}
                      </span>
                      <span className="text-xs text-slate-500">{m.sender}</span>
                    </div>
                    <p className="text-sm text-slate-400">{m.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400">No messages yet.</p>
            )}
          </Card>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

import { Footer } from "../components/Footer";
