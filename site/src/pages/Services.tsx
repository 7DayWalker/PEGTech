/** Services page — overview with links to individual service pages. */
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { Card } from "../components/Card";
import { Container, SectionHeader } from "../components/Section";
import { Badge } from "../components/Badge";
import {
  ArrowRight,
  Globe,
  Smartphone,
  Cpu,
  Megaphone,
  Palette,
  Settings,
} from "lucide-react";

const SERVICES = [
  {
    id: "web",
    name: "Web Development",
    desc: "Custom websites and web applications built for performance, security, and scale. From landing pages to full web platforms.",
    icon: "Globe",
    features: ["Responsive design", "SEO-friendly architecture", "Fast loading speeds", "CMS integration"],
    startingAt: "$2,500",
  },
  {
    id: "app",
    name: "Mobile Apps",
    desc: "iOS and Android apps that engage your customers and streamline your business operations.",
    icon: "Smartphone",
    features: ["Cross-platform", "Push notifications", "Offline mode", "App store deployment"],
    startingAt: "$5,000",
  },
  {
    id: "ai",
    name: "AI Solutions",
    desc: "AI agents, automation, and machine learning tailored to your business — from customer service to lead scoring.",
    icon: "Cpu",
    features: ["AI chatbots", "Lead scoring", "Call summarization", "Content generation"],
    startingAt: "$3,000",
  },
  {
    id: "marketing",
    name: "Digital Marketing",
    desc: "SEO, content strategy, and campaign management that drives growth and measurable ROI.",
    icon: "Megaphone",
    features: ["SEO audits", "Content strategy", "Paid campaigns", "Analytics & reporting"],
    startingAt: "$1,500",
  },
  {
    id: "design",
    name: "Brand & Design",
    desc: "Visual identity and UI/UX design that resonates with your audience and builds trust.",
    icon: "Palette",
    features: ["Logo design", "Brand guidelines", "UI/UX design", "Design systems"],
    startingAt: "$1,200",
  },
  {
    id: "consulting",
    name: "Tech Consulting",
    desc: "Technology strategy, architecture review, and fractional CTO support for growing businesses.",
    icon: "Settings",
    features: ["Tech audits", "Architecture review", "CTO support", "Digital strategy"],
    startingAt: "$200/hr",
  },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Globe: Globe as React.ElementType,
  Smartphone: Smartphone as React.ElementType,
  Cpu: Cpu as React.ElementType,
  Megaphone: Megaphone as React.ElementType,
  Palette: Palette as React.ElementType,
  Settings: Settings as React.ElementType,
};

export function Services() {
  useTitle("Services — PEGTech");

  return (
    <div className="flex-1">
        <section className="py-24">
          <Container>
            <SectionHeader>
              <Badge variant="accent" className="mb-4 inline-block">Our Services</Badge>
              <h1 className="text-balance">Services</h1>
              <p className="mt-4 text-lg text-gray-400 max-w-2xl">
                Full-stack digital agency services — web, mobile, AI, marketing, design,
                and consulting. Built for businesses in Nigeria and worldwide.
              </p>
            </SectionHeader>

            <div className="mt-16 grid md:grid-cols-3 gap-6">
              {SERVICES.map((s) => {
                const Icon = ICON_MAP[s.icon];
                return (
                  <Card key={s.id} hover padding="lg" className="group">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gemini-blue/20 via-gemini-purple/20 to-gemini-pink/20 flex items-center justify-center text-gemini-purple mb-6 group-hover:from-gemini-blue/30 group-hover:via-gemini-purple/30 group-hover:to-gemini-pink/30 transition-colors duration-300">
                      <Icon size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gemini-blue transition-colors">
                      {s.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">{s.desc}</p>
                    <div className="space-y-3 mb-6">
                      {s.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/10 text-gemini-blue"></span>
                          {f}
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <span className="text-xs font-bold text-gemini-blue uppercase tracking-wider">
                        Starting at {s.startingAt}
                      </span>
                    </div>
                    <Link
                      to={`/services#${s.id}`}
                      className="mt-4 inline-flex items-center gap-1 text-gemini-blue text-sm font-medium hover:underline group-hover:text-gemini-pink transition-colors"
                    >
                      Explore <ArrowRight size={16} />
                    </Link>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-24">
          <Container>
            <Card className="glass-card border-white/15 p-12 text-center shadow-2xl shadow-gemini-purple/10">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to start your project?
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Tell us about your business and we'll recommend the right solution for
                your goals and budget.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/book"
                  className="btn-primary text-base px-8 py-4 w-full sm:w-auto"
                >
                  Book a Consultation
                </Link>
                <Link
                  to="/contact"
                  className="btn-outline text-base px-8 py-4 w-full sm:w-auto"
                >
                  Send a Message
                </Link>
              </div>
            </Card>
          </Container>
        </section>
    </div>
  );
}
