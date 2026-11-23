"""
Configuration for Lead Gen SaaS — multi-niche, no Supabase required.
All settings come from environment variables.
"""
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "Lead Gen SaaS"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = True
    secret_key: str = "dev-secret-change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database (Railway PostgreSQL or local SQLite)
    database_url: str = "sqlite:///./leadgen.db"

    # Email (SMTP)
    sender_email: str = ""
    sender_name: str = ""
    sender_phone: str = ""
    postal_address: str = ""
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    # Compliance / outreach URLs
    unsubscribe_base_url: str = ""
    preview_base_url: str = ""

    # WhatsApp Business (Meta Graph API)
    whatsapp_access_token: str = ""
    whatsapp_phone_number_id: str = ""
    whatsapp_verify_token: str = "leadgen_verify_token"

    # Google Drive (optional asset backup)
    google_drive_folder_id: Optional[str] = None

    # CORS (comma-separated string, e.g. "*" or "https://a.com,https://b.com")
    cors_origins: str = "*"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()