"""
SQLAlchemy ORM models for the Lead Gen SaaS.
Multi-niche: users, niches, leads, campaigns, sends, preview sites, templates.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, Numeric, Index, func
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=True)
    timezone = Column(String(64), default="UTC")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    niches = relationship("Niche", back_populates="user", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="user", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="user", cascade="all, delete-orphan")
    sends = relationship("Send", back_populates="user", cascade="all, delete-orphan")
    preview_sites = relationship("PreviewSite", back_populates="user", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="user", cascade="all, delete-orphan")


class Niche(Base):
    __tablename__ = "niches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g., "Roofing", "Plumbing", "HVAC"
    slug = Column(String(100), nullable=False, index=True)  # e.g., "roofing", "plumbing"
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="niches")
    leads = relationship("Lead", back_populates="niche")
    templates = relationship("Template", back_populates="niche")

    __table_args__ = (
        Index("ix_niches_user_slug", "user_id", "slug", unique=True),
    )


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    niche_id = Column(Integer, ForeignKey("niches.id", ondelete="SET NULL"), nullable=True, index=True)

    # Core contact info
    business_name = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    state = Column(String(50), nullable=True, index=True)
    country = Column(String(50), default="US")
    email = Column(String(255), nullable=True, index=True)
    website = Column(String(500), nullable=True)

    # Qualification data
    rating = Column(Numeric(3, 2), nullable=True)
    review_count = Column(Integer, nullable=True)
    email_confidence = Column(String(20), default="none")
    email_source = Column(String(255), nullable=True)

    # Outreach status
    send_status = Column(String(50), default="not_contacted", index=True)
    whatsapp_opt_in = Column(Boolean, default=False)
    email_opt_in = Column(Boolean, default=False)
    opt_out = Column(Boolean, default=False)
    unsubscribe_token = Column(String(255), unique=True, index=True, nullable=True)

    # Preview
    preview_url = Column(String(500), nullable=True)
    preview_slug = Column(String(100), unique=True, index=True, nullable=True)

    notes = Column(Text, nullable=True)
    last_contacted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="leads")
    niche = relationship("Niche", back_populates="leads")
    sends = relationship("Send", back_populates="lead", cascade="all, delete-orphan")
    preview_site = relationship("PreviewSite", back_populates="lead", uselist=False, cascade="all, delete-orphan")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    niche_id = Column(Integer, ForeignKey("niches.id", ondelete="SET NULL"), nullable=True, index=True)

    name = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=True)
    body_text = Column(Text, nullable=True)
    body_html = Column(Text, nullable=True)
    channel = Column(String(20), default="email")  # email, whatsapp, sms
    status = Column(String(50), default="draft", index=True)  # draft, active, paused, completed

    total_leads = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    replied_count = Column(Integer, default=0)
    opt_out_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="campaigns")
    niche = relationship("Niche")
    sends = relationship("Send", back_populates="campaign", cascade="all, delete-orphan")


class Send(Base):
    __tablename__ = "sends"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)

    channel = Column(String(20), nullable=False, index=True)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=True)
    status = Column(String(50), default="pending", index=True)  # pending, sent, delivered, read, replied, bounced, failed
    message_id = Column(String(255), nullable=True)
    error = Column(Text, nullable=True)

    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    replied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="sends")
    campaign = relationship("Campaign", back_populates="sends")
    lead = relationship("Lead", back_populates="sends")


class PreviewSite(Base):
    __tablename__ = "preview_sites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    niche_id = Column(Integer, ForeignKey("niches.id", ondelete="SET NULL"), nullable=True, index=True)

    slug = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=True)
    html_content = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True)
    view_count = Column(Integer, default=0)
    last_viewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="preview_sites")
    lead = relationship("Lead", back_populates="preview_site")
    niche = relationship("Niche")


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    niche_id = Column(Integer, ForeignKey("niches.id", ondelete="SET NULL"), nullable=True, index=True)

    name = Column(String(255), nullable=False)
    channel = Column(String(20), default="email")  # email, whatsapp
    subject = Column(String(500), nullable=True)
    body_text = Column(Text, nullable=True)
    body_html = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="templates")
    niche = relationship("Niche")