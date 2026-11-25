/** About page — company story, mission, values. */
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { Card } from "../components/Card";
import { Section, Container, SectionHeader } from "../components/Section";
import { Badge } from "../components/Badge";
import { GlowBackground } from "../components/GlowBackground";
import { ArrowRight, Users, ShieldCheck, Clock, Globe, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "PEGTech rebuilt our ordering flow around WhatsApp and our online sales jumped almost overnight. They actually understood how our customers shop.",
    name: "Adaeze Nwosu",
    role: "Founder, Lagos Retail Chain",
  },
  {
    quote: "The AI lead scoring alone paid for the whole engagement. Our sales team finally knows who to call first.",
    name: "James Okonkwo",
    role: "Growth Lead, Nigerian Marketing Agency",
  },
  {
    quote: "Responsive, senior, and genuinely invested in our roadmap — exactly what we needed as a remote-first team in the UK.",
    name: "Sarah Whitfield",
    role: "Operations Director, UK Consultancy",
  },
];

export function About() {
  useTitle("About — PEGTech");

  const values = [
    {
      title: "Nigeria-based",
      desc: "Rooted in Lagos, serving businesses across Nigeria and worldwide.",
      icon: Globe,
    },
    {
      title: "WhatsApp-first",
      desc: "Meta-verified WhatsApp integration — reach customers where they already are.",
      icon: Clock,
    },
    {
      title: "AI-first delivery",
      desc: "Every project leverages AI for faster delivery and better outcomes.",
      icon: ShieldCheck,
    },
    {
      title: "Compliant & secure",
      desc: "CAN-SPAM compliant, data privacy, and full unsubscribe handling built-in.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="relative overflow-hidden py-24">
        <GlowBackground variant="hero" />
        <Container className="relative">
          {/* Hero */}
          <section className="text-center mb-24">
            <Badge variant="accent" className="mb-4 inline-block reveal-up" style={{ animationDelay: "0.1s" }}>About Us</Badge>
            <h1 className="text-balance reveal-up" style={{ animationDelay: "0.2s" }}>
              <span className="text-gradient">Who We Are</span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed reveal-up" style={{ animationDelay: "0.3s" }}>
              PEGTech is a digital agency that helps businesses in Nigeria and around
              the world build web applications, mobile apps, AI solutions, and digital
              marketing campaigns that drive real growth.
            </p>
          </section>

          {/* Mission */}
          <Section className="py-16">
            <Container>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-6">
                    Helping local businesses compete globally
                  </h2>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    We believe that great digital products shouldn't be reserved for big
                    corporations with massive budgets. Whether you're a retail shop in
                    Lagos, a consultancy in London, or a startup in Nairobi — we build
                    tools that help you grow.
                  </p>
                  <p className="text-gray-400 mb-8 leading-relaxed">
                    Our team combines technical expertise with business strategy to
                    deliver projects that don't just look good — they perform.
                  </p>
                  <Link
                    to="/contact"
                    className="btn-primary"
                  >
                    Start a Conversation <ArrowRight size={16} />
                  </Link>
                </div>
                <Card padding="lg">
                  <div className="flex items-center gap-3 mb-6">
                    <Users size={24} className="text-gemini-blue" />
                    <h3 className="text-xl font-bold text-white">Our Mission</h3>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    To be the digital partner of choice for growth-minded businesses
                    in emerging markets — delivering world-class technology at accessible
                    prices.
                  </p>
                </Card>
              </div>
            </Container>
          </Section>

          {/* Values */}
          <Section inverse py={32}>
            <Container>
              <SectionHeader>
                <Badge variant="accent" className="mb-4 inline-block">Our Values</Badge>
                <h2 className="text-balance">What guides us</h2>
              </SectionHeader>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {values.map((v) => (
                  <Card key={v.title} padding="lg" className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gemini-blue/20 via-gemini-purple/20 to-gemini-pink/20 flex items-center justify-center text-gemini-purple mx-auto mb-5">
                      <v.icon size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">{v.title}</h3>
                    <p className="text-sm text-gray-400">{v.desc}</p>
                  </Card>
                ))}
              </div>
            </Container>
          </Section>

          {/* Testimonials */}
          <section className="py-24">
            <SectionHeader>
              <Badge variant="accent" className="mb-4 inline-block">What Clients Say</Badge>
              <h2 className="text-balance">Trusted by growing businesses</h2>
            </SectionHeader>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <Card
                  key={t.name}
                  padding="lg"
                  className="reveal-up"
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                >
                  <div className="flex gap-1 mb-4 text-gemini-blue">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="py-24">
            <Container>
              <Card className="glass-card border-white/15 p-12 text-center shadow-2xl shadow-gemini-purple/10">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Let's build something great together
                </h2>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                  Tell us about your project and we'll get back to you within 24 hours.
                </p>
                <Link
                  to="/contact"
                  className="btn-primary text-base px-8 py-4 w-full sm:w-auto"
                >
                  Get in Touch
                </Link>
              </Card>
            </Container>
          </section>
        </Container>
      </div>
  );
}
