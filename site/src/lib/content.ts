/**
 * Shared content types and static data for PEGTech frontend.
 */

export interface ClientOut {
  id: number
  company: string
  contact_name?: string
  email?: string
  phone?: string
  industry?: string
  market?: string
  engagement?: string
  campaign?: string
  status: string
  rag: string
  progress_pct: number
  created_at: string
  updated_at: string
}

export interface ProjectOut {
  id: number
  name: string
  slug: string
  status: string
  budget_usd?: number
  created_at: string
  updated_at: string
}

export interface LeadOut {
  id: number
  name: string
  business_name?: string
  email?: string
  phone?: string
  status: string
  score: string
  ai_score?: number
  created_at: string
  updated_at: string
}

export interface CampaignOut {
  id: number
  name: string
  status: string
  channel: string
  total_leads: number
  sent_count: number
  created_at: string
  updated_at: string
}

export interface AuditOut {
  annual_leak_usd: number
  monthly_leak_usd: number
  ad_waste_usd: number
  risk_pct: number
}

export interface AuditReportOut {
  id: number
  industry: string
  annual_leak_usd: number
  risk_pct: number
  created_at: string
}

export interface BookingOut {
  id: number
  name: string
  email: string
  day: string
  slot: string
  ref: string
  created_at: string
}

export interface ApplicationOut {
  id: number
  name: string
  email: string
  role: string
  status: string
  ai_score?: number
  created_at: string
}

export interface AiInteractionOut {
  id: number
  session_id: string
  response: string
  intent: string
  escalate: boolean
  created_at: string
}

// Static services data
export const SERVICES = [
  {
    name: "Web Development",
    description: "Custom websites and web applications built for performance and scale.",
    icon: "globe",
  },
  {
    name: "AI Solutions",
    description: "AI agents, automation, and machine learning tailored to your business.",
    icon: "cpu",
  },
  {
    name: "Digital Marketing",
    description: "SEO, content strategy, and campaign management that drives growth.",
    icon: "megaphone",
  },
  {
    name: "Brand & Design",
    description: "Visual identity and UI/UX design that resonates with your audience.",
    icon: "palette",
  },
  {
    name: "Tech Consulting",
    description: "Technology strategy, architecture review, and fractional CTO support.",
    icon: "headset",
  },
]

// Static FAQs
export const FAQS = [
  {
    q: "What services does PEGTech offer?",
    a: "We build web applications, AI solutions, digital marketing campaigns, brand identities, and provide tech consulting.",
  },
  {
    q: "How long does a typical project take?",
    a: "Most projects range from 4 to 12 weeks depending on scope and complexity.",
  },
  {
    q: "Do you work with startups?",
    a: "Yes! We love working with early-stage companies to build their digital foundations.",
  },
  {
    q: "What is your pricing model?",
    a: "Project-based pricing with clear milestones. We also offer retainer options for ongoing support.",
  },
]
