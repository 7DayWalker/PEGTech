/** Staff dashboard — submitted AI Revenue-Leak Audit reports.
 *
 * The /audit calculator itself is a public, client-facing lead magnet
 * (linked from the marketing Home/Services pages) — a prospective
 * customer fills it in to self-estimate how much revenue they're
 * losing. This page is the staff-side counterpart: a queue of everyone
 * who actually used it, so the team can see and follow up on inbound
 * interest instead of that data sitting invisible in the database.
 * Backed by the existing staff-only GET /api/audit endpoint.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTitle } from "../../lib/useTitle";
import { api } from "../../lib/api";
import { Card } from "../../components/Card";
import { Container } from "../../components/Section";
import { Badge } from "../../components/Badge";
import { GlowBackground } from "../../components/GlowBackground";
import { ArrowLeft, TrendingDown, Mail } from "lucide-react";

type AuditReport = {
  id: number;
  industry: string;
  leads_band: string;
  response_time: string;
  pipeline: string;
  deal_band: string;
  annual_leak_usd: number;
  monthly_leak_usd: number;
  ad_waste_usd: number;
  risk_pct: number;
  email?: string | null;
  model_version: string;
  created_at: string;
};

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function riskClasses(pct: number): string {
  if (pct >= 70) return "bg-red-500/10 text-red-400 border-red-500/20";
  if (pct >= 40) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-white/5 text-gray-400 border-white/10";
}

export function AuditReportsAdmin() {
  useTitle("Audit Reports — PEGTech Admin");
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/audit").then(async (res) => {
      setReports(res.ok ? await res.json() : []);
      setLoading(false);
    });
  }, []);

  const withEmail = useMemo(() => reports.filter((r) => r.email), [reports]);
  const avgLeak = useMemo(
    () => (reports.length ? reports.reduce((sum, r) => sum + r.annual_leak_usd, 0) / reports.length : 0),
    [reports],
  );

  return (
    <div className="relative overflow-hidden py-8 px-4 min-h-screen">
      <GlowBackground />
      <Container className="relative">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              <span className="text-gradient">Audit Reports</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {reports.length} submitted{withEmail.length > 0 && ` · ${withEmail.length} left an email`}
            </p>
          </div>
        </div>

        {!loading && reports.length === 0 && (
          <Card padding="lg" className="text-center text-gray-400">
            Nobody has run the public Revenue-Leak Audit yet. Once a visitor does, their
            submission (industry, estimated leak, and email if they gave one) shows up here.
          </Card>
        )}

        {!loading && reports.length > 0 && (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <Card padding="md">
                <p className="text-xs text-gray-400 mb-1">Total submissions</p>
                <p className="text-2xl font-bold text-white">{reports.length}</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-gray-400 mb-1">Left an email</p>
                <p className="text-2xl font-bold text-white">{withEmail.length}</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-gray-400 mb-1">Avg. estimated annual leak</p>
                <p className="text-2xl font-bold text-white">{money(avgLeak)}</p>
              </Card>
            </div>

            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-gray-400 uppercase tracking-wide">
                      <th className="px-4 py-3">Submitted</th>
                      <th className="px-4 py-3">Industry</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Inputs</th>
                      <th className="px-4 py-3">Est. annual leak</th>
                      <th className="px-4 py-3">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-200 font-medium">{r.industry}</td>
                        <td className="px-4 py-3">
                          {r.email ? (
                            <a
                              href={`mailto:${r.email}`}
                              className="inline-flex items-center gap-1.5 text-gemini-blue hover:underline"
                            >
                              <Mail size={13} /> {r.email}
                            </a>
                          ) : (
                            <span className="text-gray-500 italic">Anonymous</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {r.leads_band} leads/mo · {r.response_time} response · {r.pipeline} · {r.deal_band} deals
                        </td>
                        <td className="px-4 py-3 text-gray-200 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <TrendingDown size={14} className="text-red-400" />
                            {money(r.annual_leak_usd)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`border ${riskClasses(r.risk_pct)}`}>{r.risk_pct}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </Container>
    </div>
  );
}
