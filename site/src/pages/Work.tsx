/** Work / Case Studies page — showcasing past projects. */
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { Card } from "../components/Card";
import { Container, SectionHeader } from "../components/Section";
import { Badge } from "../components/Badge";
import { ArrowRight, Globe, Smartphone, Cpu, Megaphone, Palette } from "lucide-react";
import caseEcommerce from "../assets/case-ecommerce.png";
import caseLogistics from "../assets/case-logistics.png";
import caseAiLeads from "../assets/case-ai-leads.png";
import caseMarketing from "../assets/case-marketing.png";
import caseBranding from "../assets/case-branding.png";
import caseCrm from "../assets/case-crm.png";

const PROJECTS = [
  {
    title: "Lagos Retail Chain",
    category: "E-commerce Website",
    client: "Retail • Nigeria",
    description: "Full-stack online store with inventory management, WhatsApp ordering, and payment integration.",
    result: "40% increase in online sales",
    image: caseEcommerce,
    icon: Globe,
  },
  {
    title: "Abuja Logistics Firm",
    category: "Fleet Management App",
    client: "Logistics • Nigeria",
    description: "Mobile app for real-time vehicle tracking, driver dispatch, and maintenance scheduling.",
    result: "25% reduction in fuel costs",
    image: caseLogistics,
    icon: Smartphone,
  },
  {
    title: "Nigerian Marketing Agency",
    category: "AI Lead Scoring",
    client: "Marketing • Nigeria",
    description: "AI system that scores and routes inbound leads to sales reps based on engagement and intent.",
    result: "3x faster lead response",
    image: caseAiLeads,
    icon: Cpu,
  },
  {
    title: "UK Consultancy",
    category: "Digital Marketing",
    client: "Consulting • UK",
    description: "SEO and content strategy that doubled organic traffic in 6 months.",
    result: "2x organic traffic",
    image: caseMarketing,
    icon: Megaphone,
  },
  {
    title: "Creative Studio",
    category: "Brand & Design",
    client: "Design • Canada",
    description: "Complete brand identity redesign including logo, guidelines, and website.",
    result: "New brand launched",
    image: caseBranding,
    icon: Palette,
  },
  {
    title: "West African NGO",
    category: "Tech Consulting",
    client: "Non-profit • Ghana",
    description: "Digital transformation strategy and CRM implementation for donor management.",
    result: "50% time saved on admin",
    image: caseCrm,
    icon: Cpu,
  },
];

export function Work() {
  useTitle("Our Work — PEGTech");

  return (
    <div className="flex-1 py-24">
        <Container>
          <SectionHeader>
            <Badge variant="accent" className="mb-4 inline-block">Case Studies</Badge>
            <h1 className="text-balance">Our Work</h1>
            <p className="mt-4 text-lg text-gray-400">
              Real projects for real businesses across Nigeria, UK, Canada, and beyond.
            </p>
          </SectionHeader>

          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {PROJECTS.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.title} hover padding="none" className="overflow-hidden group">
                  <div className="h-56 bg-dark-700 overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <Icon size={20} className="text-gemini-blue mt-0.5" />
                      <span className="text-xs font-bold text-gemini-blue uppercase tracking-wider">
                        {p.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gemini-blue transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">{p.client}</p>
                    <p className="text-sm text-gray-400 mb-6">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-gemini-blue font-semibold text-sm">{p.result}</span>
                      <Link
                        to="/contact"
                        className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                      >
                        Discuss similar project <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link to="/work" className="btn-outline">
              See All Projects
            </Link>
          </div>
        </Container>
    </div>
  );
}
