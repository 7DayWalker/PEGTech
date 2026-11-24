/**
 * AI service client — wraps backend AI endpoints.
 */
import { api } from "./api"

export const ai = {
  /** Draft an outreach email using AI */
  draftEmail: (data: {
    lead_name: string
    business_name?: string
    service?: string
    tone?: string
    key_points?: string
  }) => api.post("/api/ai/email/draft", data),

  /** Summarize a call transcript using AI */
  summarizeCall: (data: {
    transcript: string
    speaker_names?: string
  }) => api.post("/api/ai/call/summarize", data),

  /** Score a lead using AI */
  scoreLead: (data: {
    lead_name: string
    business_name?: string
    industry?: string
    website?: string
    notes?: string
  }) => api.post("/api/ai/lead/score", data),

  /** Generate a project proposal using AI */
  generateProposal: (data: {
    client_name: string
    project_name: string
    services: string
    timeline_weeks?: number
    budget_usd?: number
  }) => api.post("/api/ai/proposal", data),

  /** Meeting assistant — extract action items, decisions, follow-ups */
  meetingAssistant: (data: {
    transcript: string
    meeting_type?: string
  }) => api.post("/api/ai/meeting", data),

  /** Generate content (blog, social, email, landing page) */
  generateContent: (data: {
    topic: string
    content_type: "blog" | "social" | "email" | "landing_page"
    tone?: string
    target_audience?: string
    key_points?: string
  }) => api.post("/api/ai/content", data),

  /** AI CSR — first response before human joins */
  csrResponse: (data: {
    message: string
    session_id?: string
    history?: Array<{ role: string; content: string }>
  }) => api.post("/api/chat/csr", data),
}
