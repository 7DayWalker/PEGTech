/** Careers page — job listings and application form. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { api } from "../lib/api";
import { useToast } from "../lib/Toast";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/Card";
import { Container, SectionHeader } from "../components/Section";
import { Badge } from "../components/Badge";
import { Mail, ArrowRight } from "lucide-react";

export function Careers() {
  useTitle("Careers — PEGTech");
  const { show } = useToast();
  const [roles] = useState<any[]>([
    {
      id: 1,
      role: "Full-Stack Engineer",
      meta: "Full-time • Remote",
      blurb:
        "Build scalable web applications and AI integrations using React, TypeScript, Python, and PostgreSQL.",
    },
    {
      id: 2,
      role: "AI Product Designer",
      meta: "Full-time • Hybrid (Lagos)",
      blurb:
        "Design intuitive user experiences for AI-powered products and client dashboards.",
    },
    {
      id: 3,
      role: "Growth Marketer",
      meta: "Full-time • Remote",
      blurb:
        "Lead SEO, content strategy, and paid campaigns to drive client acquisition.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [form] = useState({
    role_id: "",
    name: "",
    email: "",
    phone: "",
    experience: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/public/careers/apply", {
        role_id: parseInt(form.role_id),
        name: form.name,
        email: form.email,
        phone: form.phone,
        experience: form.experience,
      });
      if (res.ok) {
        const data = await res.json();
        show(
          `Application submitted!${
            data.flags?.length ? ` Flags: ${data.flags.join(", ")}` : ""
          }`,
          data.flags?.length ? "error" : "success"
        );
      }
    } catch {
      show("Application failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
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
            <div className="ml-auto flex items-center gap-3">
              <Link
                to="/"
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      <main className="flex-1 py-16">
        <Container>
          <section className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 inline-block">Join Our Team</Badge>
              <h1 className="text-3xl font-bold text-slate-100 mb-4">
                Careers at PEGTech
              </h1>
              <p className="text-slate-400">
                We're building the future of client services. Help us shape it.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {roles.map((role) => (
                <Card key={role.id} hover padding="lg" className="group">
                  <CardHeader className="mb-4">
                    <div className="flex items-start gap-3">
                      <Mail size={20} className="text-accent mt-0.5" />
                      <div>
                        <CardTitle>{role.role}</CardTitle>
                        <span className="text-xs text-slate-500 uppercase tracking-wider">
                          {role.meta}
                        </span>
                      </div>
                    </div>
                    <CardDescription>{role.blurb}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.role_id = role.id.toString();
                      }}
                      className="w-full"
                    >
                      Apply for this role <ArrowRight size={16} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {form.role_id && (
              <Card padding="lg" className="mt-10">
                <SectionHeader className="text-left mb-8">
                  <h2 className="text-2xl font-bold text-slate-100 mb-2">
                    Apply
                  </h2>
                </SectionHeader>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    label="Full name"
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={(e) => {
                      form.name = e.target.value;
                    }}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="jane@company.com"
                    value={form.email}
                    onChange={(e) => {
                      form.email = e.target.value;
                    }}
                    required
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => {
                      form.phone = e.target.value;
                    }}
                    required
                  />
                  <Textarea
                    label="Experience"
                    rows={4}
                    value={form.experience}
                    onChange={(e) => {
                      form.experience = e.target.value;
                    }}
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Submitting…" : "Submit Application"}
                  </Button>
                </form>
              </Card>
            )}
          </section>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

import { Footer } from "../components/Footer";
