/** FAQ page — common questions answered. */
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { Card } from "../components/Card";
import { Container, SectionHeader } from "../components/Section";
import { Badge } from "../components/Badge";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "What services does PEGTech offer?",
    a: "We build web applications, mobile apps, AI solutions, digital marketing campaigns, brand identities, and provide tech consulting for businesses in Nigeria and worldwide.",
  },
  {
    q: "How long does a typical project take?",
    a: "Most projects range from 4 to 12 weeks depending on scope and complexity. We provide a detailed timeline after the discovery call.",
  },
  {
    q: "Do you work with startups?",
    a: "Yes! We love working with early-stage companies to build their digital foundations — from MVP to full product.",
  },
  {
    q: "What is your pricing model?",
    a: "Project-based pricing with clear milestones. We also offer retainer options for ongoing support and maintenance.",
  },
  {
    q: "Do you work with international clients?",
    a: "Absolutely. While we're Nigeria-based, we serve clients in the UK, US, Canada, Australia, and EU. Communication is via email, WhatsApp, and video calls.",
  },
  {
    q: "Is your WhatsApp integration Meta-verified?",
    a: "Yes. We use Meta-verified WhatsApp Business for client communication — reliable, secure, and professional.",
  },
  {
    q: "Are you CAN-SPAM compliant?",
    a: "Yes. All email marketing we help set up includes accurate headers, valid postal addresses, clear opt-out, and unsubscribe handling within 10 business days.",
  },
  {
    q: "Do you offer ongoing support after launch?",
    a: "Yes. We offer retainer packages for maintenance, updates, and ongoing digital marketing support.",
  },
];

export function FAQ() {
  useTitle("FAQ — PEGTech");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-1 py-24">
        <Container>
          <SectionHeader>
            <Badge variant="accent" className="mb-4 inline-block">Frequently Asked Questions</Badge>
            <h1 className="text-balance">FAQ</h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl">
              Everything you need to know about working with PEGTech.
            </p>
          </SectionHeader>

          <div className="mt-16 max-w-3xl mx-auto space-y-4">
            {FAQS.map((faq) => {
              const isOpen = openIds.has(faq.q);
              return (
                <Card key={faq.q} hover padding="md" className="group cursor-pointer" onClick={() => toggle(faq.q)}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white group-hover:text-gemini-blue transition-colors">
                      {faq.q}
                    </h3>
                    <ChevronDown
                      size={20}
                      className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""} text-gray-400 group-hover:text-gemini-blue`}
                    />
                  </div>
                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="mt-20 text-center">
            <Badge variant="accent" className="mb-4 inline-block">Still have questions?</Badge>
            <h2 className="text-2xl font-bold text-white mb-6">
              Let's talk directly
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/book"
                className="btn-primary text-base px-8 py-4 w-full sm:w-auto"
              >
                Book a Call
              </Link>
              <a
                href="mailto:hello@pegtech.co"
                className="btn-outline text-base px-8 py-4 w-full sm:w-auto"
              >
                Email Us <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </Container>
      </div>
  );
}
