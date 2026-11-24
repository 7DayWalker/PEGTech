/** Services page. */
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { Card, CardTitle, CardDescription, CardContent } from "../components/Card";
import { Container, SectionHeader } from "../components/Section";
import { Badge } from "../components/Badge";
import { SERVICES } from "../lib/content";
import {
  Globe,
  Cpu,
  Megaphone,
  Palette as PaletteIcon,
  ArrowRight,
  Layers,
  Zap,
  Settings,
} from "lucide-react";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  "Web Development": Globe,
  "AI Solutions": Cpu,
  "Digital Marketing": Megaphone,
  "Brand & Design": PaletteIcon,
  "Tech Consulting": Settings,
};

const SERVICE_FEATURES: Record<string, string[]> = {
  "Web Development": [
    "Custom websites and web applications",
    "Performance and scale optimization",
    "Responsive design for all devices",
    "SEO-friendly architecture",
  ],
  "AI Solutions": [
    "AI agents and automation",
    "Machine learning models",
    "Natural language processing",
    "Computer vision",
  ],
  "Digital Marketing": [
    "SEO and content strategy",
    "Campaign management",
    "Social media marketing",
    "Conversion optimization",
  ],
  "Brand & Design": [
    "Visual identity design",
    "UI/UX design",
    "Brand guidelines",
    "Design systems",
  ],
  "Tech Consulting": [
    "Technology strategy",
    "Architecture review",
    "Fractional CTO support",
    "Technical due diligence",
  ],
};

export function Services() {
  useTitle("Services — PEGTech");

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
              <Link to="/book" className="btn variant-primary size-sm">
                Book a Call
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      <main className="flex-1">
        <section className="py-24">
          <Container>
            <SectionHeader>
              <Badge className="mb-4 inline-block">Our Expertise</Badge>
              <h1 className="text-balance">Services</h1>
              <p className="mt-4 text-lg text-slate-400 max-w-2xl">
                Full-stack digital agency services — web, app, AI, marketing, design,
                and consulting. Built for modern businesses.
              </p>
            </SectionHeader>

            <div className="mt-16 grid md:grid-cols-3 gap-6">
              {SERVICES.map((s) => {
                const Icon = SERVICE_ICONS[s.name] || Layers;
                const features = SERVICE_FEATURES[s.name] || [];
                return (
                  <Card key={s.name} hover padding="lg" className="group">
                    <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent mb-6 group-hover:bg-accent/10 transition-colors duration-300">
                      <Icon size={28} />
                    </div>
                    <CardTitle>{s.name}</CardTitle>
                    <CardDescription>{s.description}</CardDescription>
                    <CardContent className="mt-6 space-y-3">
                      {features.map((f) => (
                        <div key={f} className="flex items-center gap-2">
                          <Zap size={14} className="text-accent/50" />
                          <span className="text-sm text-slate-400">{f}</span>
                        </div>
                      ))}
                      <Link
                        to="/book"
                        className="mt-4 inline-flex items-center gap-1 text-accent text-sm font-medium hover:underline transition-colors"
                      >
                        Book this service <ArrowRight size={16} />
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}

import { Footer } from "../components/Footer";
