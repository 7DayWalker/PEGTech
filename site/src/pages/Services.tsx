/** Services page — overview with links to individual service pages. */
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { Card } from "../components/Card";
import { Container, SectionHeader } from "../components/Section";
import { Badge } from "../components/Badge";
import { GlowBackground } from "../components/GlowBackground";
import {
  ArrowRight,
  Globe,
  Smartphone,
  Cpu,
  Megaphone,
  Palette,
  Settings,
  Headset,
  Mail,
  Phone,
  Target,
  FileText,
  CalendarCheck,
  PenTool,
  TrendingDown,
  Search,
  PencilRuler,
  Code2,
  Rocket,
  LifeBuoy,
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
    popular: true,
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

const AI_CAPABILITIES = [
  { name: "AI Customer Service", desc: "24/7 chat & WhatsApp agent that qualifies leads and answers FAQs.", icon: Headset },
  { name: "Email Drafting", desc: "On-brand replies and outreach drafted in seconds, reviewed by your team.", icon: Mail },
  { name: "Call Summarization", desc: "Every sales or support call auto-transcribed and summarized with next steps.", icon: Phone },
  { name: "Lead Scoring", desc: "AI ranks inbound leads by intent and value so your team calls the right ones first.", icon: Target },
  { name: "Proposal Generation", desc: "Scoped, priced proposals generated from a discovery call in minutes.", icon: FileText },
  { name: "Meeting Assistant", desc: "Automated notes, action items, and follow-ups from every client meeting.", icon: CalendarCheck },
  { name: "Content Generator", desc: "Blog posts, social captions, and ad copy drafted in your brand voice.", icon: PenTool },
  { name: "Revenue-Leak Audit", desc: "AI analysis that finds where your business loses money — slow replies, dead leads, ad waste.", icon: TrendingDown, link: "/audit", linkLabel: "Run your free audit" },
];

const PROCESS = [
  { step: "01", name: "Discover", desc: "We audit your current setup, goals, and budget on a free discovery call.", icon: Search },
  { step: "02", name: "Design", desc: "Wireframes and visual design, reviewed with you before a line of code is written.", icon: PencilRuler },
  { step: "03", name: "Build", desc: "Agile development with weekly check-ins — AI-accelerated for speed without cutting corners.", icon: Code2 },
  { step: "04", name: "Launch", desc: "QA, deployment, and a smooth go-live with zero surprises.", icon: Rocket },
  { step: "05", name: "Support", desc: "Ongoing maintenance, monitoring, and AI-powered support after launch.", icon: LifeBuoy },
];

export function Services() {
  useTitle("Services — PEGTech");

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative pt-16 pb-20 lg:pt-20 lg:pb-24 overflow-hidden">
        <GlowBackground variant="hero" />
        <Container className="relative">
          <SectionHeader>
            <Badge variant="accent" className="mb-6 inline-block reveal-up uppercase tracking-widest" style={{ animationDelay: "0.1s" }}>
              Our Services
            </Badge>
            <h1 className="text-balance reveal-up" style={{ animationDelay: "0.2s" }}>
              Full-stack <span className="text-gradient">digital services</span>
              <br />
              for growing businesses
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed reveal-up" style={{ animationDelay: "0.3s" }}>
              Web, mobile, AI, marketing, design, and consulting — built for businesses
              in Nigeria and worldwide. Pick a service below or book a call and we'll
              recommend the right mix for your goals.
            </p>
          </SectionHeader>
        </Container>
      </section>

      {/* Service cards */}
      <section className="pb-24">
        <Container>
          <div className="grid md:grid-cols-3 gap-6">
            {SERVICES.map((s, i) => {
              const Icon = ICON_MAP[s.icon];
              return (
                <Card
                  key={s.id}
                  hover
                  padding="lg"
                  className={`group relative reveal-up ${s.popular ? "border-accent/40 shadow-xl shadow-accent/10" : ""}`}
                  style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                >
                  {s.popular && (
                    <Badge variant="accent" className="absolute -top-3 right-6">
                      Most Requested
                    </Badge>
                  )}
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
                        <span className="w-1.5 h-1.5 rounded-full bg-gemini-blue"></span>
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-gemini-blue uppercase tracking-wider">
                      Starting at {s.startingAt}
                    </span>
                    <Link
                      to="/book"
                      className="inline-flex items-center gap-1 text-gray-400 text-sm font-medium hover:text-white transition-colors"
                    >
                      Get started <ArrowRight size={16} />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* AI Capabilities */}
      <section className="py-24 border-y border-white/10 bg-dark-900/40 relative">
        <Container className="relative">
          <SectionHeader>
            <Badge className="mb-4 inline-block">AI, Built In</Badge>
            <h2 className="text-balance">Every project ships with AI on day one</h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              These aren't bolt-on features — they're the same AI tooling our own team
              runs on, available as part of any engagement.
            </p>
          </SectionHeader>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AI_CAPABILITIES.map((cap, i) => (
              <Card
                key={cap.name}
                padding="lg"
                className="reveal-up"
                style={{ animationDelay: `${0.1 + i * 0.06}s` }}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gemini-blue/20 via-gemini-purple/20 to-gemini-pink/20 flex items-center justify-center text-gemini-purple mb-4">
                  <cap.icon size={20} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{cap.name}</h3>
                <p className="text-sm text-gray-400">{cap.desc}</p>
                {cap.link && (
                  <Link
                    to={cap.link}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gemini-purple hover:text-gemini-pink transition-colors"
                  >
                    {cap.linkLabel} <ArrowRight size={14} />
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Process */}
      <section className="py-24">
        <Container>
          <SectionHeader>
            <Badge className="mb-4 inline-block">How We Work</Badge>
            <h2 className="text-balance">From first call to launch day</h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              A clear, five-step process — so you always know what's happening and
              what's next.
            </p>
          </SectionHeader>

          <div className="grid md:grid-cols-5 gap-6">
            {PROCESS.map((p, i) => (
              <div
                key={p.name}
                className="relative reveal-up"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <Card padding="lg" className="h-full">
                  <span className="text-xs font-bold text-gemini-blue tracking-widest">{p.step}</span>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gemini-blue/20 via-gemini-purple/20 to-gemini-pink/20 flex items-center justify-center text-gemini-purple my-4">
                    <p.icon size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{p.name}</h3>
                  <p className="text-sm text-gray-400">{p.desc}</p>
                </Card>
                {i < PROCESS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ teaser */}
      <section className="pb-24">
        <Container>
          <Card className="glass-card border-white/15 p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
              <p className="text-gray-400">
                Pricing, timelines, and how our AI tooling works — answered in our FAQ.
              </p>
            </div>
            <Link to="/faq" className="btn-outline text-base px-8 py-4 whitespace-nowrap">
              Visit FAQ <ArrowRight size={18} />
            </Link>
          </Card>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-24">
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
