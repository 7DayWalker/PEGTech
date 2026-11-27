/** Admin portal — staff dashboard with stats and quick actions. */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useToast } from "../lib/Toast";
import { Card } from "../components/Card";
import { Container } from "../components/Section";
import { Badge } from "../components/Badge";
import { GlowBackground } from "../components/GlowBackground";
import { Modal } from "../components/Modal";
import { Textarea } from "../components/Input";
import { Button } from "../components/Button";
import { Users, Folder, Mail, BarChart3, AlertTriangle, RefreshCw, Sparkles, Flame, Eye, MessageCircle, Siren, TrendingUp, ExternalLink } from "lucide-react";

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

/** Same HOT/WARM/COLD thresholds as the Leads page's AI priority badge,
 * so the color language is consistent wherever an ai_score shows up. */
function aiScoreClasses(score: number): string {
  if (score >= 75) return "bg-red-500/10 text-red-400 border-red-500/20";
  if (score >= 45) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-white/5 text-gray-400 border-white/10";
}

export function AdminPortal() {
  useTitle("Admin Portal — PEGTech");
  const navigate = useNavigate();
  const { user, initializing } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [briefing, setBriefing] = useState<any>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [topLeads, setTopLeads] = useState<any[]>([]);
  const [topLeadsLoading, setTopLeadsLoading] = useState(true);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [viewingEscalation, setViewingEscalation] = useState<any | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const { show } = useToast();

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

  function loadTopLeads() {
    setTopLeadsLoading(true);
    api.get("/api/admin/leads/top-priority?limit=5").then(async (res) => {
      if (res.ok) {
        setTopLeads(await res.json());
      }
      setTopLeadsLoading(false);
    }).catch(() => setTopLeadsLoading(false));
  }

  function loadEscalations() {
    api.get("/api/admin/escalations").then(async (res) => {
      if (res.ok) {
        const all = await res.json();
        setEscalations(all.filter((e: any) => e.status === "queued"));
      }
    }).catch(() => {});
  }

  async function resolveEscalation(id: number, note?: string) {
    setResolvingId(id);
    try {
      const res = await api.put(`/api/admin/escalations/${id}`, { resolve_note: note || "Resolved from dashboard." });
      if (res.ok) {
        setEscalations((prev) => prev.filter((e) => e.id !== id));
        setViewingEscalation((prev: any) => (prev && prev.id === id ? null : prev));
        loadStats();
        show("Escalation resolved.", "success");
      } else {
        show("Couldn't resolve escalation.", "error");
      }
    } finally {
      setResolvingId(null);
    }
  }

  /** Clicking a flagged escalation anywhere on the dashboard opens this
   * in place — it's the only record of a visitor-sourced escalation (no
   * Lead/Client exists for an anonymous site visitor), and even for a
   * client-sourced one, the triggering message lives in a different table
   * than the Message Center reads from. A generic "go to the Leads/
   * Clients list and find it yourself" link was the actual bug being
   * fixed here. */
  function openEscalation(id: number) {
    const esc = escalations.find((e) => e.id === id);
    if (!esc) {
      show("That escalation was already resolved.", "success");
      return;
    }
    setResolveNote("");
    setViewingEscalation(esc);
  }

  useEffect(() => {
    if (user && user.typ === "staff") {
      loadStats();
      loadBriefing();
      loadTopLeads();
      loadEscalations();
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
                  const inner = (
                    <>
                      <div className={`w-7 h-7 rounded-lg bg-dark-700 flex items-center justify-center shrink-0 ${color}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{item.title}</p>
                        {item.detail && <p className="text-xs text-gray-500 truncate">{item.detail}</p>}
                      </div>
                    </>
                  );
                  const rowClass = "flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors w-full text-left";

                  // An escalation opens its own detail (transcript + AI
                  // summary + resolve) in place — there's often no Lead/
                  // Client record to deep-link to at all (an anonymous
                  // website visitor isn't either), so this is the only
                  // place that ever shows the actual flagged content.
                  if (item.type === "pending_escalation") {
                    return (
                      <button key={idx} onClick={() => openEscalation(item.escalation_id)} className={rowClass}>
                        {inner}
                      </button>
                    );
                  }

                  // Everything else deep-links to the specific record —
                  // previously these all pointed at the generic Leads/
                  // Clients list, leaving staff to go hunt for the one
                  // that was actually flagged.
                  const action = item.type === "unread_message" ? "message" : "edit";
                  const to = item.lead_id
                    ? `/admin/leads?lead=${item.lead_id}&action=${action}`
                    : item.client_id
                      ? `/admin/clients?client=${item.client_id}&action=${action}`
                      : "/admin/leads";
                  return (
                    <Link key={idx} to={to} className={rowClass}>
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Top priority leads — highest AI-scored leads not yet won/lost */}
          {!topLeadsLoading && topLeads.length > 0 && (
            <Card padding="lg" className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-gemini-purple" />
                  Top Priority Leads
                </h3>
                <Link to="/admin/leads" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  View all leads →
                </Link>
              </div>
              <div className="space-y-2">
                {topLeads.map((lead: any) => (
                  <Link
                    key={lead.id}
                    to={`/admin/leads?lead=${lead.id}&action=edit`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold border shrink-0 ${aiScoreClasses(lead.ai_score)}`}
                      title={lead.ai_score_reason || undefined}
                    >
                      {lead.ai_score}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {lead.business_name || lead.name}
                      </p>
                      {lead.ai_score_reason && (
                        <p className="text-xs text-gray-500 truncate">{lead.ai_score_reason}</p>
                      )}
                    </div>
                  </Link>
                ))}
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

          {/* Escalations alert — each one shows its AI-written summary
              (falls back to the raw flagged message if the summary hasn't
              landed yet) instead of just a count, so staff can judge
              urgency without opening anything. */}
          {stats.pending_escalations > 0 && (
            <Card padding="md" className="border-l-4 border-blue-500 bg-white/5">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle size={20} className="text-gemini-purple mt-0.5" />
                <div>
                  <h4 className="font-bold text-gemini-pink">Pending Escalations</h4>
                  <p className="text-sm text-blue-200">
                    {stats.pending_escalations} escalation(s) waiting for attention.
                  </p>
                </div>
              </div>
              {escalations.length > 0 && (
                <div className="space-y-2">
                  {escalations.slice(0, 5).map((esc) => (
                    <div
                      key={esc.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg bg-black/20 border border-white/5 hover:border-white/15 transition-colors cursor-pointer"
                      onClick={() => openEscalation(esc.id)}
                    >
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {esc.source} {esc.sentiment ? `· ${esc.sentiment}` : ""}
                        </p>
                        <p className="text-sm text-gray-200">{esc.ai_summary || esc.summary}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); resolveEscalation(esc.id); }}
                        disabled={resolvingId === esc.id}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-50 transition-colors"
                      >
                        {resolvingId === esc.id ? "Resolving…" : "Resolve"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </Container>

        <Modal
          isOpen={!!viewingEscalation}
          onClose={() => setViewingEscalation(null)}
          title="Escalation"
          size="lg"
        >
          {viewingEscalation && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="warning">{viewingEscalation.sentiment || "flagged"}</Badge>
                <span className="text-gray-500">
                  {viewingEscalation.source} · {new Date(viewingEscalation.created_at).toLocaleString()}
                </span>
                {viewingEscalation.client_id && (
                  <Link
                    to={`/admin/clients?client=${viewingEscalation.client_id}&action=edit`}
                    className="ml-auto inline-flex items-center gap-1 text-gemini-blue hover:underline"
                  >
                    View client <ExternalLink size={12} />
                  </Link>
                )}
                {viewingEscalation.lead_id && (
                  <Link
                    to={`/admin/leads?lead=${viewingEscalation.lead_id}&action=edit`}
                    className="ml-auto inline-flex items-center gap-1 text-gemini-blue hover:underline"
                  >
                    View lead <ExternalLink size={12} />
                  </Link>
                )}
                {!viewingEscalation.client_id && !viewingEscalation.lead_id && (
                  <span className="ml-auto text-gray-500 italic">Anonymous website visitor — no linked record</span>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Reason</p>
                <p className="text-sm text-gray-200">{viewingEscalation.reason}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1 flex items-center gap-1">
                  <Sparkles size={12} className="text-gemini-purple" /> AI summary
                </p>
                <p className="text-sm text-gray-200">{viewingEscalation.ai_summary || viewingEscalation.summary}</p>
              </div>

              {viewingEscalation.transcript && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Transcript</p>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-black/30 rounded-lg p-3 max-h-60 overflow-y-auto font-sans">
                    {viewingEscalation.transcript}
                  </pre>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Resolution note (optional)</p>
                <Textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="What did you do about this?"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setViewingEscalation(null)}>
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => resolveEscalation(viewingEscalation.id, resolveNote)}
                  disabled={resolvingId === viewingEscalation.id}
                >
                  {resolvingId === viewingEscalation.id ? "Resolving…" : "Mark resolved"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
    </div>
  );
}
