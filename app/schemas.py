"""
Pydantic schemas for API request/response validation.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    company_name: Optional[str] = None
    timezone: Optional[str] = "UTC"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    company_name: Optional[str] = None
    timezone: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    company_name: Optional[str] = None
    timezone: Optional[str] = None


# ---------------------------------------------------------------------------
# Niches
# ---------------------------------------------------------------------------
class NicheBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class NicheCreate(NicheBase):
    pass


class NicheUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class NicheOut(NicheBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Leads
# ---------------------------------------------------------------------------
class LeadBase(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "US"
    email: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    review_count: Optional[int] = Field(None, ge=0)
    niche_id: Optional[int] = None
    email_confidence: Optional[str] = "none"
    email_source: Optional[str] = None
    send_status: Optional[str] = "not_contacted"
    whatsapp_opt_in: Optional[bool] = False
    email_opt_in: Optional[bool] = False
    opt_out: Optional[bool] = False
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    business_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    niche_id: Optional[int] = None
    email_confidence: Optional[str] = None
    email_source: Optional[str] = None
    send_status: Optional[str] = None
    whatsapp_opt_in: Optional[bool] = None
    email_opt_in: Optional[bool] = None
    opt_out: Optional[bool] = None
    notes: Optional[str] = None
    last_contacted_at: Optional[datetime] = None


class LeadOut(LeadBase):
    id: int
    user_id: int
    unsubscribe_token: Optional[str] = None
    preview_url: Optional[str] = None
    preview_slug: Optional[str] = None
    last_contacted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LeadListResponse(BaseModel):
    leads: List[LeadOut]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Campaigns
# ---------------------------------------------------------------------------
class CampaignBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    subject: Optional[str] = None
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    channel: str = Field("email", pattern="^(email|whatsapp|sms)$")
    niche_id: Optional[int] = None


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    channel: Optional[str] = Field(None, pattern="^(email|whatsapp|sms)$")
    status: Optional[str] = Field(None, pattern="^(draft|active|paused|completed)$")
    niche_id: Optional[int] = None


class CampaignOut(CampaignBase):
    id: int
    user_id: int
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
# Sends
# ---------------------------------------------------------------------------
class SendBase(BaseModel):
    campaign_id: Optional[int] = None
    lead_id: Optional[int] = None
    channel: str = Field(..., pattern="^(email|whatsapp|sms)$")
    recipient: str
    subject: Optional[str] = None
    status: str = "pending"
    message_id: Optional[str] = None
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


class SendStats(BaseModel):
    total: int
    email_sent: int
    whatsapp_sent: int
    failed: int
    pending: int


# ---------------------------------------------------------------------------
# Preview Sites
# ---------------------------------------------------------------------------
class PreviewSiteBase(BaseModel):
    lead_id: Optional[int] = None
    niche_id: Optional[int] = None
    slug: str = Field(..., min_length=1, max_length=100)
    title: Optional[str] = None
    html_content: Optional[str] = None
    is_public: Optional[bool] = True


class PreviewSiteCreate(PreviewSiteBase):
    pass


class PreviewSiteUpdate(BaseModel):
    title: Optional[str] = None
    html_content: Optional[str] = None
    is_public: Optional[bool] = None


class PreviewSiteOut(PreviewSiteBase):
    id: int
    user_id: int
    view_count: int
    last_viewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
class TemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    channel: str = Field("email", pattern="^(email|whatsapp)$")
    subject: Optional[str] = None
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    niche_id: Optional[int] = None
    is_default: Optional[bool] = False


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    channel: Optional[str] = Field(None, pattern="^(email|whatsapp)$")
    subject: Optional[str] = None
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    niche_id: Optional[int] = None
    is_default: Optional[bool] = None


class TemplateOut(TemplateBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------
class DashboardStats(BaseModel):
    total_leads: int
    leads_contacted: int
    total_campaigns: int
    active_campaigns: int
    total_sends: int
    sent_count: int
    replied_count: int
    opt_out_count: int


# ---------------------------------------------------------------------------
# Import
# ---------------------------------------------------------------------------
class ImportPreview(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    preview: List[dict]
    errors: List[str]