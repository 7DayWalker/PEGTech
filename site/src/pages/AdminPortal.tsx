/** Admin portal — staff dashboard with stats and quick actions. */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { api } from "../lib/api";
import { Card } from "../components/Card";
import { Container } from "../components/Section";
import { Badge } from "../components/Badge";
import { Users, Folder, Mail, BarChart3, AlertTriangle, LogOut } from "lucide-react";

export function AdminPortal() {
  useTitle("Admin Portal — PEGTech");
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/stats").then(async (res) => {
      if (res.ok) setStats(await res.json());
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

  if (!stats) {
    navigate("/signin");
    return null;
  }

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
              <Link
                to="/admin/clients"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Clients
              </Link>
              <Link
                to="/admin/projects"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Projects
              </Link>
              <Link
                to="/admin/leads"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Leads
              </Link>
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
              <Badge className="mb-3 inline-block">Staff Dashboard</Badge>
              <h1 className="text-2xl font-bold text-slate-100 mb-1">
                Admin Portal
              </h1>
              <p className="text-slate-400">Manage your agency operations</p>
            </div>
            <Link to="/admin/clients" className="btn variant-primary size-sm">
              + New Client
            </Link>
          </div>

          {/* Stats cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Clients",
                value: stats.total_clients,
                icon: Users,
                color: "text-blue-400",
              },
              {
                label: "Projects",
                value: stats.total_projects,
                icon: Folder,
                color: "text-green-400",
              },
              {
                label: "Leads",
                value: stats.total_leads,
                icon: Mail,
                color: "text-purple-400",
              },
              {
                label: "Escalations",
                value: stats.pending_escalations,
                icon: AlertTriangle,
                color: "text-orange-400",
              },
            ].map((stat) => (
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

          {/* Quick actions */}
          <Card padding="lg" className="mb-8">
            <h3 className="text-lg font-bold text-slate-100 mb-6">
              Quick Actions
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <Link
                to="/admin/clients"
                className="p-4 rounded-xl border border-border/50 hover:bg-slate-800/50 hover:border-slate-600/50 transition-colors text-center"
              >
                <Users size={24} className="mx-auto mb-2 text-slate-400 group-hover:text-blue-400 transition-colors" />
                <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  Manage Clients
                </p>
              </Link>
              <Link
                to="/admin/projects"
                className="p-4 rounded-xl border border-border/50 hover:bg-slate-800/50 hover:border-slate-600/50 transition-colors text-center"
              >
                <Folder size={24} className="mx-auto mb-2 text-slate-400 group-hover:text-green-400 transition-colors" />
                <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  Manage Projects
                </p>
              </Link>
              <Link
                to="/admin/leads"
                className="p-4 rounded-xl border border-border/50 hover:bg-slate-800/50 hover:border-slate-600/50 transition-colors text-center"
              >
                <Mail size={24} className="mx-auto mb-2 text-slate-400 group-hover:text-purple-400 transition-colors" />
                <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  Manage Leads
                </p>
              </Link>
              <Link
                to="/audit"
                className="p-4 rounded-xl border border-border/50 hover:bg-slate-800/50 hover:border-slate-600/50 transition-colors text-center"
              >
                <BarChart3 size={24} className="mx-auto mb-2 text-slate-400 group-hover:text-accent transition-colors" />
                <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  Run AI Audit
                </p>
              </Link>
            </div>
          </Card>

          {/* Escalations alert */}
          {stats.pending_escalations > 0 && (
            <Card padding="md" className="border-l-4 border-orange-500 bg-orange-500/10">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-orange-300">Pending Escalations</h4>
                  <p className="text-sm text-orange-200">
                    You have {stats.pending_escalations} escalation(s) waiting for attention.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}

import { Footer } from "../components/Footer";
