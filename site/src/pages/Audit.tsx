/** AI Revenue-Leak Audit calculator page. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { api } from "../lib/api";
import { useToast } from "../lib/Toast";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import { Card } from "../components/Card";
import { Container, SectionHeader } from "../components/Section";
import { Badge } from "../components/Badge";
import { ArrowRight, TrendingUp, DollarSign } from "lucide-react";

const LEAD_BANDS = ["Under 50", "50 – 150", "150 – 400", "400+"];
const RESPONSE_TIMES = ["Under 5 mins", "Under 1 hour", "Same day", "Next day +"];
const PIPELINES = ["CRM / system", "Spreadsheet", "Inbox / DMs only", "Nothing structured"];
const DEAL_BANDS = ["Under $250", "$250 – $1,500", "$1,500 – $6,000", "$6,000+"];

export function Audit() {
  useTitle("AI Revenue-Leak Audit — PEGTech");
  const { show } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({
    industry: "Marketing Agency",
    leads: LEAD_BANDS[1],
    response: RESPONSE_TIMES[2],
    pipeline: PIPELINES[1],
    deal: DEAL_BANDS[2],
    email: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/public/audit", form);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      show("Audit calculation failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 py-16">
        <Container>
          {result ? (
            <section className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 mb-4">
                  <TrendingUp size={16} /> Audit Complete
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  Your Revenue-Leak Report
                </h1>
                <p className="text-gray-400">
                  Based on your inputs, here's your estimated monthly revenue leak.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[result.annual_leak_usd, result.monthly_leak_usd, result.risk_pct].map(
                  (val: any, i: number) => {
                    const labels = ["Annual Leak", "Monthly Leak", "Risk Level"];
                    const formats = [
                      `$${(val / 1000).toFixed(0)}K`,
                      `$${(val / 1000).toFixed(0)}K`,
                      `${val}%`,
                    ];
                    return (
                      <Card key={i} padding="lg" className="text-center">
                        <div className="text-2xl font-bold text-accent mb-1">
                          {formats[i]}
                        </div>
                        <div className="text-sm text-gray-400">{labels[i]}</div>
                      </Card>
                    );
                  }
                )}
              </div>

              <div className="space-y-6">
                <div className="Card p-6 rounded-2xl border border-border bg-dark-800/50">
                  <div className="flex items-start gap-3">
                    <DollarSign size={24} className="text-gemini-blue mt-0.5" />
                    <div>
                      <h3 className="font-bold text-white">Estimated Annual Revenue Leak</h3>
                      <p className="text-sm text-gray-400">
                        Based on lead response times, pipeline health, and deal size,
                        your business could be losing approximately{" "}
                        <span className="text-gemini-blue font-bold">
                          ${(result.annual_leak_usd / 1000).toFixed(0)}K per year
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <Link
                  to="/book"
                  className="btn-primary text-base px-8 py-4"
                >
                  Book a Consultation <ArrowRight size={16} />
                </Link>
              </div>
            </section>
          ) : (
            <section className="max-w-2xl mx-auto">
              <SectionHeader>
                <Badge variant="accent" className="mb-4 inline-block">AI-Powered Diagnostic</Badge>
                <h1 className="text-balance">AI Revenue-Leak Audit</h1>
                <p className="mt-4 text-lg text-gray-400">
                  Answer 5 questions to estimate how much revenue your business is losing
                  to slow response times, poor pipeline, and ad waste.
                </p>
              </SectionHeader>

              <Card padding="lg" className="mt-10">
                <form onSubmit={(e) => runAudit(e)} className="space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Input
                        label="Your industry"
                        placeholder="e.g. Marketing Agency"
                        value={form.industry}
                        onChange={(e) => update("industry", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Monthly leads"
                        value={form.leads}
                        onChange={(e) => update("leads", e.target.value)}
                      >
                        {LEAD_BANDS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Average response time to leads"
                        value={form.response}
                        onChange={(e) => update("response", e.target.value)}
                      >
                        {RESPONSE_TIMES.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Lead pipeline / CRM"
                        value={form.pipeline}
                        onChange={(e) => update("pipeline", e.target.value)}
                      >
                        {PIPELINES.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Average deal size"
                        value={form.deal}
                        onChange={(e) => update("deal", e.target.value)}
                      >
                        {DEAL_BANDS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Input
                        label="Your email (optional, for report)"
                        type="email"
                        placeholder="you@company.com"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading}
                      className="w-full py-4"
                    >
                      {loading ? "Calculating…" : "Run Audit"}
                    </Button>
                  </div>
                </form>
              </Card>
            </section>
          )}
        </Container>
    </div>
  );
}
