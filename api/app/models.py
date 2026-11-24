"""
SQLAlchemy 2.x ORM models for PEGTech — client-services agency platform.
"""
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    String, Integer, Float, Date, DateTime, ForeignKey, Text, UniqueConstraint, Boolean, Numeric
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base


# ---------------------------------------------------------------------------
# Auth / users
# ---------------------------------------------------------------------------
class AdminUser(Base):
    """Staff members who run the agency."""
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(500), nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    role: Mapped[str] = mapped_column(String(40), default="staff")  # staff, owner
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    projects = relationship("Project", back_populates="owner")
    applications = relationship("Application", back_populates="reviewer")


class ClientUser(Base):
    """Client portal users."""
    __tablename__ = "client_users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="users")


# ---------------------------------------------------------------------------
# Clients & projects
# ---------------------------------------------------------------------------
class Client(Base):
    """Client companies."""
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    contact_name: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    market: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    engagement: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    campaign: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    channels: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # JSON list
    kpi_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="active")  # active, paused, completed
    rag: Mapped[str] = mapped_column(String(20), default="green")  # green, amber, red
    week_label: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    progress_pct: Mapped[int] = mapped_column(Integer, default=0)
    strategist_id: Mapped[Optional[int]] = mapped_column(ForeignKey("admin_users.id"), nullable=True)
    delivery_lead_id: Mapped[Optional[int]] = mapped_column(ForeignKey("admin_users.id"), nullable=True)
    success_lead_id: Mapped[Optional[int]] = mapped_column(ForeignKey("admin_users.id"), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("ClientUser", back_populates="client", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="client", cascade="all, delete-orphan")
    deliverables = relationship("Deliverable", back_populates="client", cascade="all, delete-orphan")
    weekly_updates = relationship("WeeklyUpdate", back_populates="client", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="client", cascade="all, delete-orphan")
    messages = relationship("ClientMessage", back_populates="client", cascade="all, delete-orphan")
    escalations = relationship("Escalation", back_populates="client", cascade="all, delete-orphan")
    qa_reviews = relationship("QAReview", back_populates="client", cascade="all, delete-orphan")


class Project(Base):
    """Client projects."""
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id: Mapped[Optional[int]] = mapped_column(ForeignKey("admin_users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="planning")  # planning, active, paused, completed, archived
    budget_usd: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    started_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    due_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="projects")
    owner = relationship("AdminUser", back_populates="projects")
    deliverables = relationship("Deliverable", back_populates="project", cascade="all, delete-orphan")


class Deliverable(Base):
    """Project deliverables."""
    __tablename__ = "deliverables"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    due_label: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="todo")  # todo, in_progress, review, done
    sort: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="deliverables")
    project = relationship("Project", back_populates="deliverables")


class WeeklyUpdate(Base):
    """Weekly progress updates for clients."""
    __tablename__ = "weekly_updates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    week_label: Mapped[str] = mapped_column(String(40), nullable=False)
    headline: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    kpis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    status: Mapped[str] = mapped_column(String(20), default="published")  # draft, published
    entered_by: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    published_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="weekly_updates")


# ---------------------------------------------------------------------------
# Leads & campaigns
# ---------------------------------------------------------------------------
class Lead(Base):
    """Prospect leads."""
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    source: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    service: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    score: Mapped[str] = mapped_column(String(10), default="WARM")  # HOT / WARM / COLD
    ai_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # AI-computed 0-100
    value_usd: Mapped[float] = mapped_column(Float, default=0)
    stage: Mapped[int] = mapped_column(Integer, default=0)  # 0=new, 1=contacted, 2=qualified, 3=proposal, 4=won
    email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    country: Mapped[str] = mapped_column(String(50), default="US")
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    email_confidence: Mapped[str] = mapped_column(String(20), default="none")
    email_source: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    whatsapp_opt_in: Mapped[bool] = mapped_column(Boolean, default=False)
    email_opt_in: Mapped[bool] = mapped_column(Boolean, default=False)
    opt_out: Mapped[bool] = mapped_column(Boolean, default=False)
    unsubscribe_token: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_contacted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sends = relationship("CampaignSend", back_populates="lead", cascade="all, delete-orphan")


class Campaign(Base):
    """Marketing campaigns."""
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    body_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    body_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    channel: Mapped[str] = mapped_column(String(20), default="email")  # email, whatsapp
    status: Mapped[str] = mapped_column(String(40), default="draft")  # draft, active, paused, completed
    total_leads: Mapped[int] = mapped_column(Integer, default=0)
    sent_count: Mapped[int] = mapped_column(Integer, default=0)
    replied_count: Mapped[int] = mapped_column(Integer, default=0)
    opt_out_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("AdminUser")
    sends = relationship("CampaignSend", back_populates="campaign", cascade="all, delete-orphan")


class CampaignSend(Base):
    """Individual campaign sends."""
    __tablename__ = "campaign_sends"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    campaign_id: Mapped[Optional[int]] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=True, index=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    channel: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    recipient: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="pending")  # pending, sent, delivered, read, replied, bounced, failed
    message_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    replied_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="sends")
    lead = relationship("Lead", back_populates="sends")


# ---------------------------------------------------------------------------
# Bookings
# ---------------------------------------------------------------------------
class Booking(Base):
    """Appointment bookings."""
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(60), nullable=False)
    day: Mapped[date] = mapped_column(Date, nullable=False)
    slot: Mapped[str] = mapped_column(String(5), nullable=False)
    timezone_hint: Mapped[str] = mapped_column(String(40), default="")
    service: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    ref: Mapped[str] = mapped_column(String(16), unique=True, index=True, nullable=False)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # AI call summary
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("day", "slot", name="uq_booking_slot"),)


# ---------------------------------------------------------------------------
# Audit reports
# ---------------------------------------------------------------------------
class AuditReport(Base):
    """AI revenue-leak audit reports."""
    __tablename__ = "audit_reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    industry: Mapped[str] = mapped_column(String(80), nullable=False)
    leads_band: Mapped[str] = mapped_column(String(40), nullable=False)
    response_time: Mapped[str] = mapped_column(String(40), nullable=False)
    pipeline: Mapped[str] = mapped_column(String(60), nullable=False)
    deal_band: Mapped[str] = mapped_column(String(40), nullable=False)
    annual_leak_usd: Mapped[float] = mapped_column(Float, nullable=False)
    monthly_leak_usd: Mapped[float] = mapped_column(Float, nullable=False)
    ad_waste_usd: Mapped[float] = mapped_column(Float, nullable=False)
    risk_pct: Mapped[int] = mapped_column(Integer, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    model_version: Mapped[str] = mapped_column(String(20), default="audit-v1")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Careers
# ---------------------------------------------------------------------------
class CareerRole(Base):
    """Job openings."""
    __tablename__ = "career_roles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    role: Mapped[str] = mapped_column(String(120), nullable=False)
    meta: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    blurb: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    applications = relationship("Application", back_populates="role", cascade="all, delete-orphan")


class Application(Base):
    """Job applications."""
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("career_roles.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("admin_users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(60), nullable=False)
    experience: Mapped[str] = mapped_column(Text, nullable=False)
    answers: Mapped[str] = mapped_column(Text, default="[]")  # JSON list
    flags: Mapped[str] = mapped_column(Text, default="[]")  # JSON list of AI review flags
    status: Mapped[str] = mapped_column(String(20), default="interviewing")  # interviewing, hired, rejected
    ai_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # AI-computed 0-100
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # AI call summarization
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    role = relationship("CareerRole", back_populates="applications")
    reviewer = relationship("AdminUser", back_populates="applications")


# ---------------------------------------------------------------------------
# Chat / AI CSR
# ---------------------------------------------------------------------------
class AiInteraction(Base):
    """AI conversation logs (CSR, support, etc.)."""
    __tablename__ = "ai_interactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    user_type: Mapped[str] = mapped_column(String(40), default="visitor")  # visitor, client, staff
    user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    channel: Mapped[str] = mapped_column(String(20), default="web")  # web, whatsapp, phone
    messages: Mapped[str] = mapped_column(Text, default="[]")  # JSON list of {role, content}
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # AI call summarization
    sentiment: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # positive, neutral, negative
    escalated: Mapped[bool] = mapped_column(Boolean, default=False)
    escalated_to: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ---------------------------------------------------------------------------
# Escalations & QA
# ---------------------------------------------------------------------------
class Escalation(Base):
    """Client escalations."""
    __tablename__ = "escalations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(40), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reason: Mapped[str] = mapped_column(String(120), nullable=False)
    sentiment: Mapped[str] = mapped_column(String(20), default="neutral")
    status: Mapped[str] = mapped_column(String(40), default="queued")  # queued, claimed, resolved
    assignee_id: Mapped[Optional[int]] = mapped_column(ForeignKey("admin_users.id"), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    resolve_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="escalations")


class QAReview(Base):
    """Quality assurance reviews."""
    __tablename__ = "qa_reviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign: Mapped[str] = mapped_column(String(120), nullable=False)
    item: Mapped[str] = mapped_column(String(255), nullable=False)
    agent: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    ref: Mapped[str] = mapped_column(String(60), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    flags: Mapped[str] = mapped_column(Text, default="[]")  # JSON list
    status: Mapped[str] = mapped_column(String(40), default="queued")  # queued, passed, flagged
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="qa_reviews")


# ---------------------------------------------------------------------------
# FAQs, templates, niches
# ---------------------------------------------------------------------------
class Faq(Base):
    __tablename__ = "faqs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    question: Mapped[str] = mapped_column(String(300), nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    sort: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Template(Base):
    """Email/WhatsApp templates."""
    __tablename__ = "templates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    channel: Mapped[str] = mapped_column(String(20), default="email")  # email, whatsapp
    subject: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    body_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    body_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("AdminUser")


class Niche(Base):
    """Industry verticals."""
    __tablename__ = "niches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[Optional[int]] = mapped_column(ForeignKey("admin_users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner = relationship("AdminUser")
    __table_args__ = (UniqueConstraint("owner_id", "slug", name="uq_niche_owner_slug"),)


# ---------------------------------------------------------------------------
# Documents / uploads
# ---------------------------------------------------------------------------
class Document(Base):
    """Uploaded documents."""
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    html_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stored_name: Mapped[str] = mapped_column(String(80), default="")
    mime: Mapped[str] = mapped_column(String(120), default="")
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    last_viewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client")
    __table_args__ = (UniqueConstraint("slug", name="uq_document_slug"),)


# ---------------------------------------------------------------------------\n# Enquiries\n# ---------------------------------------------------------------------------\nclass Enquiry(Base):\n    \"\"\"Public contact-form enquiries.\"\"\"\n    __tablename__ = \"enquiries\"\n\n    id: Mapped[int] = mapped_column(primary_key=True, index=True)\n    name: Mapped[str] = mapped_column(String(120), nullable=False)\n    email: Mapped[str] = mapped_column(String(200), index=True, nullable=False)\n    phone: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)\n    company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)\n    service: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)\n    message: Mapped[str] = mapped_column(Text, nullable=False)\n    status: Mapped[str] = mapped_column(String(40), default=\"new\", index=True)\n    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
