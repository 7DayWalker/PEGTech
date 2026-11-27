/** Admin portal — staff dashboard with stats and quick actions. */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { Card } from "../components/Card";
import { Container } from "../components/Section";
import { Badge } from "../components/Badge";
import { GlowBackground } from "../components/GlowBackground";
import { Users, Folder, Mail, BarChart3, AlertTriangle, RefreshCw, Sparkles, Flame, Eye, MessageCircle, Siren } from "lucide-react";

const BRIEFING_ICONS: Record<string, any> = {
  stale_hot_lead: Flame,
  import_flag: Eye,
  unread_message: MessageCircle,
  pending_escalation: Siren,
};

const BRIEFING_COLORS: Record<string, string> = {
  stale_hot_lead: "text-red-400",
  import_flag: "text-yellow-400",
  unread_message: "text-blue-400",
  pending_escalation: "text-orange-400",
};

export function AdminPortal() {
  useTitle("Admin Portal — PEGTech");
  const navigate = useNavigate();
  const { user, initializing } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [briefing, setBriefing] = useState<any>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);

  // Auth gating lives here, driven by the shared session state — NOT by
  // whether a single data call happens to succeed. That separation is the
  // whole fix: a flaky/erroring /api/admin/stats call used to look
  // identical to "you're not logged in" and would bounce straight back to
  // sign-in even with a perfectly valid session.
  useEffect(() => {
    if (!initializing && (!user || user.typ !== "staff")) {
      navigate("/signin");
    }
  }, [initializing, user, navigate]);

  function loadStats() {
    setStatsLoading(true);
    setStatsError(null);
    api.get("/api/admin/stats").then(async (res) => {
      if (res.ok) {
        setStats(await res.json());
      } else {
        let detail = "";
        try {
          detail = JSON.stringify(await res.json());
        } catch {
          detail = await res.text().catch(() => "");
        }
        setStatsError(`Couldn't load dashboard stats (${res.status}). ${detail}`);
      }
      setStatsLoading(false);
    }).catch((err) => {
      setStatsError(`Couldn't load dashboard stats: ${err}`);
      setStatsLoading(false);
    });
  }

  function loadBriefing() {
    setBriefingLoading(true);
    api.get("/api/admin/briefing").then(async (res) => {
      if (res.ok) {
        setBriefing(await res.json());
      }
      setBriefingLoading(false);
    }).catch(() => setBriefingLoading(false));
  }

  useEffect(() => {
    if (user && user.typ === "staff") {
      loadStats();
      loadBriefing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (initializing || !user || user.typ !== "staff") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (statsError && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
        <Card padding="lg" className="max-w-md text-center">
          <AlertTriangle size={28} className="mx-auto mb-3 text-orange-400" />
          <p className="text-white font-semibold mb-1">Dashboard data unavailable</p>
          <p className="text-sm text-gray-400 mb-4">{statsError}</p>
          <button onClick={loadStats} className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-2 mx-auto">
            <RefreshCw size={15} />
            Retry
          </button>
        </Card>
      </div>
    );
  }

  if (statsLoading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden py-8 px-4">
        <GlowBackground />
        <Container className="relative">
          <div className="flex justify-between items-start mb-8">
            <div>
              <Badge variant="accent" className="mb-3 inline-block">Staff Dashboard</Badge>
              <h1 className="text-2xl font-bold text-white mb-1">
                <span className="text-gradient">Admin Portal</span>
              </h1>
              <p className="text-gray-400">Manage your agency operations</p>
            </div>
            <Link to="/admin/clients" className="btn-primary text-xs px-3 py-1.5">
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
                color: "text-gemini-blue",
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
                className="group hover:bg-white/5"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <span className="text-xs text-gray-400">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
              </Card>
            ))}
          </div>

          {/* Daily Briefing — "what needs attention today" */}
          {!briefingLoading && briefing && briefing.items?.length > 0 && (
            <Card padding="lg" className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-gemini-purple" />
                  Daily Briefing
                </h3>
                <span className="text-xs text-gray-500">
                  {briefing.items.length} item{briefing.items.length === 1 ? "" : "s"} need attention
                </span>
              </div>
              {briefing.ai_summary && (
                <p className="text-sm text-gray-300 mb-4 pb-4 border-b border-white/10">
                  {briefing.ai_summary}
                </p>
              )}
              <div className="space-y-2">
                {briefing.items.slice(0, 8).map((item: any, idx: number) => {
                  const Icon = BRIEFING_ICONS[item.type] || AlertTriangle;
                  const color = BRIEFING_COLORS[item.type] || "text-gray-400";
                  const to = item.lead_id ? "/admin/leads" : item.client_id ? "/admin/clients" : "/admin/leads";
                  return (
                    <Link
                      key={idx}
                      to={to}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-lg bg-dark-700 flex items-center justify-center shrink-0 ${color}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{item.title}</p>
                        {item.detail && <p className="text-xs text-gray-500 truncate">{item.detail}</p>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Quick actions */}
          <Card padding="lg" className="mb-8">
            <h3 className="text-lg font-bold text-white mb-6">
              Quick Actions
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <Link
                to="/admin/clients"
                className="p-4 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 transition-colors text-center"
              >
                <Users size={24} className="mx-auto mb-2 text-gray-400 group-hover:text-gemini-blue transition-colors" />
                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Manage Clients
                </p>
              </Link>
              <Link
                to="/admin/projects"
                className="p-4 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 transition-colors text-center"
              >
                <Folder size={24} className="mx-auto mb-2 text-gray-400 group-hover:text-green-400 transition-colors" />
                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Manage Projects
                </p>
              </Link>
              <Link
                to="/admin/leads"
                className="p-4 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 transition-colors text-center"
              >
                <Mail size={24} className="mx-auto mb-2 text-gray-400 group-hover:text-purple-400 transition-colors" />
                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Manage Leads
                </p>
              </Link>
              <Link
                to="/audit"
                className="p-4 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 transition-colors text-center"
              >
                <BarChart3 size={24} className="mx-auto mb-2 text-gray-400 group-hover:text-gemini-blue transition-colors" />
                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Run AI Audit
                </p>
              </Link>
            </div>
          </Card>

          {/* Escalations alert */}
          {stats.pending_escalations > 0 && (
            <Card padding="md" className="border-l-4 border-blue-500 bg-white/5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-gemini-purple mt-0.5" />
                <div>
                  <h4 className="font-bold text-gemini-pink">Pending Escalations</h4>
                  <p className="text-sm text-blue-200">
                    You have {stats.pending_escalations} escalation(s) waiting for attention.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </Container>
    </div>
  );
}
