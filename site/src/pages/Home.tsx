/** Home page — marketing landing page with hero, services, work, testimonials, CTA. */
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { Card } from "../components/Card";
import { Section, Container, SectionHeader } from "../components/Section";
import { Badge } from "../components/Badge";
import {
  Globe,
  Smartphone,
  Cpu,
  Megaphone,
  Palette,
  Settings,
  ArrowRight,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Clock,
} from "lucide-react";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  "Web Development": Globe,
  "Mobile Apps": Smartphone,
  "AI Solutions": Cpu,
  "Digital Marketing": Megaphone,
  "Brand & Design": Palette,
  "Tech Consulting": Settings,
};

const WORK_ITEMS = [
  {
    title: "Lagos Retail Chain",
    category: "E-commerce Website",
    description: "Full-stack online store with inventory management and WhatsApp ordering.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=800&q=80",
    result: "40% increase in online sales",
  },
  {
    title: "Abuja Logistics Firm",
    category: "Fleet Management App",
    description: "Mobile app for real-time vehicle tracking and driver dispatch.",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    result: "25% reduction in fuel costs",
  },
  {
    title: "Nigerian Marketing Agency",
    category: "AI Lead Scoring",
    description: "AI system that scores and routes inbound leads to sales reps.",
    image: "https://images.unsplash.com/photo-1460925895917-af663827772d?w=800&q=80",
    result: "3x faster lead response",
  },
];

const STATS = [
  { label: "Projects Delivered", value: "50+" },
  { label: "Client Retention", value: "94%" },
  { label: "Avg. Response Time", value: "< 2 hrs" },
  { label: "Years Experience", value: "8+" },
];

const FEATURES = [
  {
    title: "AI Customer Service",
    desc: "24/7 AI CSR that handles first contact, qualifies leads, and books appointments.",
    icon: Sparkles,
  },
  {
    title: "Revenue-Leak Audit",
    desc: "AI analysis that finds where your business loses money — slow responses, dead leads, ad waste.",
    icon: BarChart3,
  },
  {
    title: "WhatsApp-First",
    desc: "Meta-verified WhatsApp integration — reach customers where they already are.",
    icon: Clock,
  },
  {
    title: "Secure & Compliant",
    desc: "CAN-SPAM compliant, data privacy, and full unsubscribe handling built-in.",
    icon: ShieldCheck,
  },
];

export function Home() {
  useTitle("PEGTech — Web Apps, AI & Digital Services for Modern Businesses");

  return (
    <div className="relative overflow-hidden">
        {/* Hero */}
        <section className="relative pt-24 pb-36 lg:pt-32 lg:pb-48 overflow-hidden">
          <div className="absolute inset-0 grid-pattern pointer-events-none"></div>
          <Container>
            <SectionHeader>
              <Badge className="mb-4 inline-block reveal-up" style={{ animationDelay: "0.1s" }}>
                Nigeria-based • WhatsApp-first • Meta-verified
              </Badge>
              <h1 className="text-balance reveal-up" style={{ animationDelay: "0.2s" }}>
                We build digital products that help{" "}
                <span className="text-blue-500">local businesses grow.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed reveal-up" style={{ animationDelay: "0.3s" }}>
                Web applications, mobile apps, AI solutions, and digital marketing — built
                for businesses in Nigeria and around the world. From first line of code to
                first paying customer.
              </p>
            </SectionHeader>

            <div className="mt-16 flex flex-col sm:flex-row gap-4 justify-center reveal-up" style={{ animationDelay: "0.4s" }}>
              <Link
                to="/services"
                className="btn-primary text-base px-8 py-4 w-full sm:w-auto"
              >
                View Our Services
              </Link>
              <Link
                to="/book"
                className="btn-outline text-base px-8 py-4 w-full sm:w-auto"
              >
                Book a Consultation
              </Link>
            </div>

            {/* Trust stats */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-border/50">
              {STATS.map((s, i) => (
                <div key={s.label} className="text-center reveal-up" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                  <div className="text-3xl font-bold text-blue-500">{s.value}</div>
                  <div className="mt-2 text-sm text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Services Preview */}
        <section className="py-24 border-y border-border/50">
          <Container>
            <SectionHeader>
              <Badge className="mb-4 inline-block">Our Expertise</Badge>
              <h2 className="text-balance">Everything you need to grow online</h2>
              <p className="mt-4 text-lg text-slate-400">
                Full-stack digital agency services — web, mobile, AI, marketing, design,
                and consulting. Built for modern businesses.
              </p>
            </SectionHeader>

            <div className="mt-16 grid md:grid-cols-3 gap-6">
              {[
                { name: "Web Development", desc: "Custom websites and web applications built for performance and scale.", icon: Globe },
                { name: "Mobile Apps", desc: "iOS and Android apps that engage your customers and streamline operations.", icon: Smartphone },
                { name: "AI Solutions", desc: "AI agents, automation, and machine learning tailored to your business.", icon: Cpu },
                { name: "Digital Marketing", desc: "SEO, content strategy, and campaign management that drives growth.", icon: Megaphone },
                { name: "Brand & Design", desc: "Visual identity and UI/UX design that resonates with your audience.", icon: Palette },
                { name: "Tech Consulting", desc: "Technology strategy, architecture review, and fractional CTO support.", icon: Settings },
              ].map((s, i) => {
                const Icon = SERVICE_ICONS[s.name] || Settings;
                return (
                  <Card key={s.name} hover padding="lg" className="group reveal-up" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-500/20 transition-colors duration-300">
                      <Icon size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-3">{s.name}</h3>
                    <p className="text-sm text-slate-400 mb-6">{s.desc}</p>
                    <Link
                      to="/services"
                      className="text-blue-400 text-sm font-medium hover:underline flex items-center gap-1 group-hover:text-blue-300 transition-colors"
                    >
                      Learn more <ArrowRight size={16} />
                    </Link>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Features */}
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

            <div className="grid md:grid-cols-4 gap-6">
              {FEATURES.map((f, i) => (
                <Card key={f.title} padding="lg" className="reveal-up" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-5">
                    <f.icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-3">{f.title}</h3>
                  <p className="text-sm text-slate-400">{f.desc}</p>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* Work / Case Studies Preview */}
        <section className="py-24">
          <Container>
            <SectionHeader>
              <Badge className="mb-4 inline-block">Proven Results</Badge>
              <h2 className="text-balance">Work we're proud of</h2>
              <p className="mt-4 text-lg text-slate-400">
                Real projects for real businesses across Nigeria and internationally.
              </p>
            </SectionHeader>

            <div className="mt-16 grid md:grid-cols-3 gap-6">
              {WORK_ITEMS.map((work, i) => (
                <Card key={work.title} hover padding="none" className="reveal-up overflow-hidden" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                  <div className="h-48 bg-slate-800 overflow-hidden">
                    <img
                      src={work.image}
                      alt={work.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <Badge className="mb-3 inline-block blue">{work.category}</Badge>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">{work.title}</h3>
                    <p className="text-sm text-slate-400 mb-6">{work.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400 font-semibold text-sm">{work.result}</span>
                      <Link
                        to="/work"
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                      >
                        View case study <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link to="/work" className="btn-outline">
                See All Projects
              </Link>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-24">
          <Container>
            <Card className="rounded-3xl border-blue-500/30 bg-gradient-to-br from-dark-800 to-dark-900 p-12 md:p-20 text-center shadow-2xl shadow-blue-500/10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
                Ready to grow your business?
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Book a free 30-minute discovery call. We'll review your current setup,
                identify revenue leaks, and outline a growth plan — no obligation.
              </p>
              <Link
                to="/book"
                className="btn-primary text-base px-8 py-4 w-full sm:w-auto"
              >
                Book Your Discovery Call
              </Link>
            </Card>
          </Container>
        </section>
    </div>
  );
}
