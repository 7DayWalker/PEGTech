"""
Database connection using SQLAlchemy 2.x.
Supports Railway PostgreSQL (DATABASE_URL) or local SQLite fallback.
"""
import os
import re
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import DATABASE_URL as _RAW_DATABASE_URL


def _normalize_database_url(url: str) -> str:
    """Railway/Heroku sometimes hand out postgres:// — rewrite to postgresql+psycopg2://."""
    if url.startswith("postgres://"):
        return "postgresql+psycopg2://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


DATABASE_URL = _normalize_database_url(_RAW_DATABASE_URL)

in_memory = DATABASE_URL in ("sqlite:///:memory:", "sqlite://")
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {
        "connect_timeout": 10,
        "options": "-c lock_timeout=8000 -c statement_timeout=30000",
    }

pool_args = {"poolclass": StaticPool} if in_memory else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, future=True, **pool_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

print(f"db: engine ready on {DATABASE_URL.split('://')[0]}://...", flush=True)


class Base(DeclarativeBase):
    pass


def init_db():
    """Idempotent schema setup: create tables, then patch older SQLite files."""
    t0 = time.time()
    print("init_db: starting schema check ...", flush=True)
    from app import models  # noqa: F401 — register tables on Base.metadata
    Base.metadata.create_all(engine)
    print(f"init_db: schema ready in {time.time()-t0:.1f}s", flush=True)

    if not DATABASE_URL.startswith("sqlite"):
        return

    with engine.begin() as conn:
        def cols(table):
            return {row[1] for row in conn.exec_driver_sql(f"PRAGMA table_info({table})")}

        # Column backfills for older SQLite deployments
        specs = [
            ("documents", "stored_name", "VARCHAR(80) DEFAULT ''"),
            ("documents", "mime", "VARCHAR(120) DEFAULT ''"),
            ("documents", "size_bytes", "INTEGER DEFAULT 0"),
            ("weekly_updates", "status", "VARCHAR(20) DEFAULT 'published'"),
            ("qa_reviews", "created_at", "DATETIME"),
        ]
        for table, col, ddl in specs:
            if col not in cols(table):
                conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {col} {ddl}")

        conn.exec_driver_sql(
            "UPDATE weekly_updates SET published_at = created_at WHERE status = 'published' AND published_at IS NULL"
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
