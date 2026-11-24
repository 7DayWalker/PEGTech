/** Home page — landing page with hero, services, features, and CTA. */
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { ChatWidget } from "../components/ChatWidget";
import { ThemeToggle } from "../components/ThemeToggle";
import { Card, CardTitle, CardDescription, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { Section, Container, SectionHeader } from "../components/Section";
import { SERVICES } from "../lib/content";
import { Footer } from "../components/Footer";
import {
  Globe,
  Cpu,
  Megaphone,
  Palette,
  Headset,
  Sparkles,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  "Web Development": Globe,
  "AI Solutions": Cpu,
  "Digital Marketing": Megaphone,
  "Brand & Design": Palette,
  "Tech Consulting": Headset,
};

export function Home() {
  useTitle("PEGTech — Build Smarter. Grow Faster.");

  const stats = [
    { label: "Projects Delivered", value: "50+" },
    { label: "Client Retention", value: "94%" },
    { label: "Avg. Response Time", value: "< 2 hrs" },
    { label: "Years Experience", value: "8+" },
  ];

  const features = [
    {
      title: "AI Customer Service",
      desc: "24/7 AI CSR that handles first contact, qualifies leads, and books appointments before a human joins.",
      icon: Sparkles,
    },
    {
      title: "Revenue-Leak Audit",
      desc: "AI-powered analysis that finds where your business is losing money — slow responses, dead leads, ad waste.",
      icon: BarChart3,
    },
    {
      title: "Secure & Compliant",
      desc: "Nigeria-based, Meta-verified WhatsApp, CAN-SPAM compliant, with full data privacy and unsubscribe handling.",
      icon: ShieldCheck,
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

            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link
                to="/services"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Services
              </Link>
              <Link
                to="/book"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Book a Call
              </Link>
              <Link
                to="/audit"
                className="text-slate-400 hover:text-white transition-colors"
              >
                AI Audit
              </Link>
              <Link
                to="/careers"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Careers
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/book" className="btn variant-primary size-sm">
                Book a Call
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      <main className="flex-1 relative overflow-hidden">
        {/* Hero */}
        <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
          <div className="absolute inset-0 grid-pattern pointer-events-none"></div>
          <Container>
            <SectionHeader>
              <Badge className="mb-4 inline-block">Multi-niche • Web • App • AI Services</Badge>
              <h1 className="text-balance">
                Build smarter. <span className="text-accent">Grow faster.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Web applications, AI solutions, and digital services for modern businesses.
                AI-powered customer service, lead scoring, and revenue-leak recovery — all
                in one agency built for growth.
              </p>
            </SectionHeader>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/book"
                className="btn variant-primary size-lg w-full sm:w-auto"
              >
                Book a Consultation
              </Link>
              <Link
                to="/audit"
                className="btn variant-outline size-lg w-full sm:w-auto"
              >
                Run Revenue-Leak Audit
              </Link>
            </div>

            {/* Trust stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-border/50">
              {stats.map((s) => (
                <div key={s.label} className="text-center animate-[fadeIn_0.6s_ease-out_forwards]">
                  <div className="text-2xl font-bold text-accent">{s.value}</div>
                  <div className="mt-1 text-sm text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Services */}
        <section className="py-24 border-y border-border/50">
          <Container>
            <SectionHeader>
              <h2 className="text-balance">Our Services</h2>
              <p className="mt-4 text-lg text-slate-400">
                Everything you need to grow your business online — from first line of code
                to first paying customer.
              </p>
            </SectionHeader>

            <div className="grid md:grid-cols-3 gap-6">
              {SERVICES.map((s) => {
                const Icon = SERVICE_ICONS[s.name] || Sparkles;
                return (
                  <Card key={s.name} hover padding="lg" className="group">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-5 group-hover:scale-110 transition-transform duration-300">
                      <Icon size={24} />
                    </div>
                    <CardTitle>{s.name}</CardTitle>
                    <CardDescription>{s.description}</CardDescription>
                    <CardContent className="mt-6">
                      <Link
                        to="/book"
                        className="text-accent text-sm font-medium hover:underline flex items-center gap-1"
                      >
                        Start project <span className="text-xs">→</span>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>

        {/* AI Features */}
        <Section inverse py={32}>
          <Container>
            <SectionHeader className="text-left">
              <Badge className="mb-4 inline-block">AI-First Delivery</Badge>
              <h2 className="text-balance mb-4">AI isn't an add-on — it's built into how we work.</h2>
              <p className="text-lg text-slate-400">
                Every project leverages AI for faster delivery, lower costs, and better
                outcomes for your business.
              </p>
            </SectionHeader>

            <div className="grid md:grid-cols-3 gap-6">
              {features.map((f) => (
                <Card key={f.title} hover padding="lg">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 mb-5">
                    <f.icon size={24} />
                  </div>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* CTA */}
        <section className="py-24">
          <Container>
            <Card className="rounded-3xl border-accent/30 bg-gradient-to-br from-dark-800 to-dark-900 p-12 text-center shadow-2xl shadow-accent/10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
                Ready to grow your business?
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Book a free 30-minute discovery call. We'll review your current setup,
                identify revenue leaks, and outline a growth plan — no obligation.
              </p>
              <Link
                to="/book"
                className="btn variant-primary size-lg w-full sm:w-auto"
              >
                Book Your Discovery Call
              </Link>
            </Card>
          </Container>
        </section>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}
