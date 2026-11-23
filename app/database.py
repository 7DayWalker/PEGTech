"""
Database connection using SQLAlchemy.
Supports Railway PostgreSQL (DATABASE_URL) or local SQLite fallback.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.models import Base

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    poolclass=StaticPool if settings.database_url.startswith("sqlite") else None,
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------------------------------------------------------
# Dependency
# ---------------------------------------------------------------------------
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Initialize schema
# ---------------------------------------------------------------------------
def init_db():
    """Create all tables. In production, use Alembic migrations instead."""
    Base.metadata.create_all(bind=engine)