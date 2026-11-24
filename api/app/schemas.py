"""
Pydantic v2 schemas for PEGTech API.
"""
from datetime import date, datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, EmailStr


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    typ: Optional[str] = None
    role: Optional[str] = None
    name: Optional[str] = None
    client_id: Optional[int] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=200)


class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------
class ClientBase(BaseModel):
    company: str = Field(min_length=1, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=160)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=60)
    industry: Optional[str] = Field(None, max_length=80)
    market: Optional[str] = Field(None, max_length=80)
    engagement: Optional[str] = Field(None, max_length=80)
    campaign: Optional[str] = Field(None, max_length=160)
    channels: Optional[str] = Field(None, max_length=200)
    kpi_label: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field("active", max_length=40)
    rag: Optional[str] = Field("green", max_length=20)
    week_label: Optional[str] = Field(None, max_length=40)
    progress_pct: Optional[int] = Field(0, ge=0, le=100)
    strategist_id: Optional[int] = None
    delivery_lead_id: Optional[int] = None
    success_lead_id: Optional[int] = None
    start_date: Optional[date] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    company: Optional[str] = Field(None, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=160)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=60)
    industry: Optional[str] = Field(None, max_length=80)
    market: Optional[str] = Field(None, max_length=80)
    engagement: Optional[str] = Field(None, max_length=80)
    campaign: Optional[str] = Field(None, max_length=160)
    channels: Optional[str] = Field(None, max_length=200)
    kpi_label: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=40)
    rag: Optional[str] = Field(None, max_length=20)
    week_label: Optional[str] = Field(None, max_length=40)
    progress_pct: Optional[int] = Field(None, ge=0, le=100)
    strategist_id: Optional[int] = None
    delivery_lead_id: Optional[int] = None
    success_lead_id: Optional[int] = None
    start_date: Optional[date] = None


class ClientOut(ClientBase):
    id: int
    users: List[dict] = []
    strategist: Optional[dict] = None
    delivery_lead: Optional[dict] = None
    success_lead: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------
class ProjectBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    status: Optional[str] = Field("planning", max_length=40)
    budget_usd: Optional[float] = Field(None, ge=0)
    started_at: Optional[date] = None
    due_at: Optional[date] = None


class ProjectCreate(ProjectBase):
    client_id: int
    owner_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    slug: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    status: Optional[str] = Field(None, max_length=40)
    budget_usd: Optional[float] = Field(None, ge=0)
    started_at: Optional[date] = None
    due_at: Optional[date] = None
    owner_id: Optional[int] = None


class ProjectOut(ProjectBase):
    id: int
    client_id: int
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Deliverables
# ---------------------------------------------------------------------------
class DeliverableBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    project_id: Optional[int] = None
    due_label: Optional[str] = Field(None, max_length=80)
    status: Optional[str] = Field("todo", max_length=40)
    sort: Optional[int] = Field(0)


class DeliverableCreate(DeliverableBase):
    client_id: int


class DeliverableUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    project_id: Optional[int] = None
    due_label: Optional[str] = Field(None, max_length=80)
    status: Optional[str] = Field(None, max_length=40)
    sort: Optional[int] = None


class DeliverableOut(DeliverableBase):
    id: int
    client_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Weekly Updates
# ---------------------------------------------------------------------------
class WeeklyUpdateBase(BaseModel):
    week_label: str = Field(min_length=1, max_length=40)
    headline: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1)
    kpis: Optional[str] = None
    status: Optional[str] = Field("published", max_length=20)
    entered_by: Optional[str] = Field(None, max_length=120)


class WeeklyUpdateCreate(WeeklyUpdateBase):
    client_id: int


class WeeklyUpdateUpdate(BaseModel):
    week_label: Optional[str] = Field(None, max_length=40)
    headline: Optional[str] = Field(None, max_length=255)
    body: Optional[str] = None
    kpis: Optional[str] = None
    status: Optional[str] = Field(None, max_length=20)
    entered_by: Optional[str] = Field(None, max_length=120)


class WeeklyUpdateOut(WeeklyUpdateBase):
    id: int
    client_id: int
    published_by: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Leads
# ---------------------------------------------------------------------------
class LeadBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    business_name: Optional[str] = Field(None, max_length=255)
    source: Optional[str] = Field(None, max_length=80)
    service: Optional[str] = Field(None, max_length=160)
    score: Optional[str] = Field("WARM", max_length=10)
    ai_score: Optional[int] = Field(None, ge=0, le=100)
    value_usd: Optional[float] = Field(0, ge=0)
    stage: Optional[int] = Field(0, ge=0, le=4)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=60)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=50)
    country: Optional[str] = Field("US", max_length=50)
    website: Optional[str] = Field(None, max_length=500)
    email_confidence: Optional[str] = Field("none", max_length=20)
    email_source: Optional[str] = Field(None, max_length=255)
    whatsapp_opt_in: Optional[bool] = False
    email_opt_in: Optional[bool] = False
    opt_out: Optional[bool] = False
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=120)
    business_name: Optional[str] = Field(None, max_length=255)
    source: Optional[str] = Field(None, max_length=80)
    service: Optional[str] = Field(None, max_length=160)
    score: Optional[str] = Field(None, max_length=10)
    ai_score: Optional[int] = Field(None, ge=0, le=100)
    value_usd: Optional[float] = Field(None, ge=0)
    stage: Optional[int] = Field(None, ge=0, le=4)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=60)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=50)
    country: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=500)
    email_confidence: Optional[str] = Field(None, max_length=20)
    email_source: Optional[str] = Field(None, max_length=255)
    whatsapp_opt_in: Optional[bool] = None
    email_opt_in: Optional[bool] = None
    opt_out: Optional[bool] = None
    notes: Optional[str] = None


class LeadOut(LeadBase):
    id: int
    last_contacted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Campaigns
# ---------------------------------------------------------------------------
class CampaignBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    subject: Optional[str] = Field(None, max_length=500)
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    channel: str = Field("email", pattern="^(email|whatsapp)$")
    niche_id: Optional[int] = None


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    subject: Optional[str] = Field(None, max_length=500)
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    channel: Optional[str] = Field(None, pattern="^(email|whatsapp)$")
    status: Optional[str] = Field(None, pattern="^(draft|active|paused|completed)$")
    niche_id: Optional[int] = None


class CampaignOut(CampaignBase):
    id: int
    owner_id: int
    status: str
    total_leads: int
    sent_count: int
    replied_count: int
    opt_out_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Campaign Sends
# ---------------------------------------------------------------------------
class SendBase(BaseModel):
    campaign_id: Optional[int] = None
    lead_id: Optional[int] = None
    channel: str = Field(pattern="^(email|whatsapp)$")
    recipient: str
    subject: Optional[str] = Field(None, max_length=500)
    status: str = Field("pending", max_length=40)
    message_id: Optional[str] = Field(None, max_length=255)
    error: Optional[str] = None


class SendOut(SendBase):
    id: int
    user_id: int
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Bookings
# ---------------------------------------------------------------------------
class BookingBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=60)
    day: date
    slot: str
    timezone_hint: str = Field(default="", max_length=40)
    service: Optional[str] = Field(None, max_length=120)


class BookingCreate(BookingBase):
    pass


class BookingOut(BookingBase):
    id: int
    ref: str
    ai_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Audit Reports
# ---------------------------------------------------------------------------
class AuditIn(BaseModel):
    industry: str = Field(min_length=1, max_length=80)
    leads: str = Field(pattern=r"^(Under 50|50 – 150|150 – 400|400\+)$")
    response: str = Field(pattern=r"^(Under 5 mins|Under 1 hour|Same day|Next day \+)$")
    pipeline: str = Field(pattern=r"^(CRM / system|Spreadsheet|Inbox / DMs only|Nothing structured)$")
    deal: str = Field(pattern=r"^(Under \$250|\$250 – \$1,500|\$1,500 – \$6,000|\$6,000\+)$")
    email: Optional[EmailStr] = None


class AuditOut(BaseModel):
    annual_leak_usd: float
    monthly_leak_usd: float
    ad_waste_usd: float
    risk_pct: int


class AuditReportOut(BaseModel):
    id: int
    industry: str
    leads_band: str
    response_time: str
    pipeline: str
    deal_band: str
    annual_leak_usd: float
    monthly_leak_usd: float
    ad_waste_usd: float
    risk_pct: int
    email: Optional[str] = None
    model_version: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Careers
# ---------------------------------------------------------------------------
class CareerRoleBase(BaseModel):
    role: str = Field(min_length=1, max_length=120)
    meta: Optional[str] = Field(None, max_length=160)
    blurb: Optional[str] = None
    active: Optional[bool] = True


class CareerRoleCreate(CareerRoleBase):
    pass


class CareerRoleUpdate(BaseModel):
    role: Optional[str] = Field(None, max_length=120)
    meta: Optional[str] = Field(None, max_length=160)
    blurb: Optional[str] = None
    active: Optional[bool] = None


class CareerRoleOut(CareerRoleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationBase(BaseModel):
    role_id: int
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=60)
    experience: str = Field(min_length=10, max_length=2000)


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationOut(ApplicationBase):
    id: int
    reviewer_id: Optional[int] = None
    flags: str
    status: str
    ai_score: Optional[int] = None
    ai_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Chat / AI
# ---------------------------------------------------------------------------
class ChatTurn(BaseModel):
    role: Literal["user", "assistant"] = "user"
    content: str = Field(min_length=1, max_length=1200)


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=1500)
    history: List[ChatTurn] = Field(default_factory=list, max_length=24)


class AiInteractionOut(BaseModel):
    id: int
    session_id: str
    user_type: str
    channel: str
    ai_summary: Optional[str] = None
    sentiment: Optional[str] = None
    escalated: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Escalations
# ---------------------------------------------------------------------------
class EscalationBase(BaseModel):
    source: str = Field(min_length=1, max_length=40)
    summary: str = Field(min_length=1)
    transcript: Optional[str] = None
    reason: str = Field(min_length=1, max_length=120)
    sentiment: Optional[str] = Field("neutral", max_length=20)
    status: Optional[str] = Field("queued", max_length=40)


class EscalationCreate(EscalationBase):
    client_id: int


class EscalationOut(EscalationBase):
    id: int
    client_id: int
    ai_summary: Optional[str] = None
    assignee_id: Optional[int] = None
    resolved_at: Optional[datetime] = None
    resolve_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# QA Reviews
# ---------------------------------------------------------------------------
class QAReviewBase(BaseModel):
    campaign: str = Field(min_length=1, max_length=120)
    item: str = Field(min_length=1, max_length=255)
    agent: Optional[str] = Field(None, max_length=120)
    ref: str = Field(min_length=1, max_length=60)
    score: int = Field(ge=0, le=100)
    flags: Optional[str] = Field("[]")
    status: Optional[str] = Field("queued", max_length=40)


class QAReviewCreate(QAReviewBase):
    client_id: int


class QAReviewOut(QAReviewBase):
    id: int
    client_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# FAQs
# ---------------------------------------------------------------------------
class FaqBase(BaseModel):
    question: str = Field(min_length=1, max_length=300)
    answer: str = Field(min_length=1)
    sort: Optional[int] = Field(0)


class FaqCreate(FaqBase):
    pass


class FaqOut(FaqBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
class TemplateBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    channel: str = Field("email", pattern="^(email|whatsapp)$")
    subject: Optional[str] = Field(None, max_length=500)
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    is_default: Optional[bool] = False


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    channel: Optional[str] = Field(None, pattern="^(email|whatsapp)$")
    subject: Optional[str] = Field(None, max_length=500)
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    is_default: Optional[bool] = None


class TemplateOut(TemplateBase):
    id: int
    owner_id: int
    ai_generated: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Niches
# ---------------------------------------------------------------------------
class NicheBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = True


class NicheCreate(NicheBase):
    pass


class NicheUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    slug: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class NicheOut(NicheBase):
    id: int
    owner_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------
class DocumentBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=100)
    title: Optional[str] = Field(None, max_length=255)
    html_content: Optional[str] = None
    is_public: Optional[bool] = True


class DocumentCreate(DocumentBase):
    client_id: int


class DocumentUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    slug: Optional[str] = Field(None, max_length=100)
    title: Optional[str] = Field(None, max_length=255)
    html_content: Optional[str] = None
    is_public: Optional[bool] = None


class DocumentOut(DocumentBase):
    id: int
    client_id: int
    stored_name: str
    mime: str
    size_bytes: int
    view_count: int
    last_viewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# AI features
# ---------------------------------------------------------------------------
class AiEmailDraftIn(BaseModel):
    lead_name: str
    business_name: Optional[str] = None
    service: Optional[str] = None
    tone: Optional[str] = Field("professional", max_length=40)
    key_points: Optional[str] = Field(None, max_length=2000)


class AiEmailDraftOut(BaseModel):
    subject: str
    body_text: str
    body_html: Optional[str] = None


class AiCallSummaryIn(BaseModel):
    transcript: str = Field(min_length=10)
    speaker_names: Optional[str] = Field(None, max_length=500)


class AiCallSummaryOut(BaseModel):
    summary: str
    action_items: List[str]
    sentiment: Literal["positive", "neutral", "negative"]
    key_topics: List[str]


class AiLeadScoreIn(BaseModel):
    lead_name: str
    business_name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=2000)


class AiLeadScoreOut(BaseModel):
    score: int = Field(ge=0, le=100)
    tier: Literal["HOT", "WARM", "COLD"]
    reasoning: str
    recommended_channel: Literal["email", "whatsapp", "phone", "postal"]
    recommended_message: Optional[str] = None


class AiProposalIn(BaseModel):
    client_name: str
    project_name: str
    services: str = Field(min_length=1)
    timeline_weeks: Optional[int] = Field(None, ge=1, le=52)
    budget_usd: Optional[float] = Field(None, ge=0)


class AiProposalOut(BaseModel):
    proposal_text: str
    estimated_timeline: str
    estimated_budget: Optional[str] = None
    key_deliverables: List[str]


class AiMeetingAssistantIn(BaseModel):
    transcript: str = Field(min_length=10)
    meeting_type: Optional[str] = Field("general", max_length=60)


class AiMeetingAssistantOut(BaseModel):
    summary: str
    action_items: List[str]
    decisions: List[str]
    follow_ups: List[str]


class AiContentGeneratorIn(BaseModel):
    topic: str = Field(min_length=1, max_length=200)
    content_type: Literal["blog", "social", "email", "landing_page"]
    tone: Optional[str] = Field("professional", max_length=40)
    target_audience: Optional[str] = Field(None, max_length=200)
    key_points: Optional[str] = Field(None, max_length=2000)


class AiContentGeneratorOut(BaseModel):
    title: str
    content: str
    seo_keywords: List[str]
    meta_description: Optional[str] = None
