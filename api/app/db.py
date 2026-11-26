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


def _auto_migrate_missing_columns():
    """Add any column that exists on a model but not yet on the live table.

    Base.metadata.create_all() only creates tables that don't exist yet — it
    never ALTERs an existing table to add a column a model gained later. On
    a long-lived Postgres database (Railway) that drifts out of sync with
    models.py over time, that leaves columns silently missing, and
    SQLAlchemy's Query(Model).count() selects every mapped column internally
    (it counts rows of a wrapped subquery), so even a plain count() blows up
    with 'column does not exist' the moment a model gains a field the live
    table doesn't have yet. This works generically across SQLite and
    Postgres via SQLAlchemy's cross-dialect inspector, instead of the old
    SQLite-only PRAGMA-based approach.
    """
    from sqlalchemy import inspect
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue  # create_all() already built this one fresh, in full
            existing_cols = {c["name"] for c in inspector.get_columns(table.name)}
            for col in table.columns:
                if col.name in existing_cols:
                    continue
                try:
                    col_type = col.type.compile(dialect=engine.dialect)
                except Exception as e:
                    print(f"auto-migrate: can't compile type for {table.name}.{col.name}: {e}", flush=True)
                    continue
                ddl = f'ALTER TABLE {table.name} ADD COLUMN {col.name} {col_type}'
                try:
                    conn.exec_driver_sql(ddl)
                    print(f"auto-migrate: added {table.name}.{col.name} ({col_type})", flush=True)
                except Exception as e:
                    print(f"auto-migrate: failed to add {table.name}.{col.name}: {e}", flush=True)


def _relax_orphan_not_null_columns():
    """Drop NOT NULL on any live column that the current models.py no longer
    declares for that table.

    The mirror-image problem of _auto_migrate_missing_columns(): a long-lived
    Postgres database can also carry columns a model *used to* have and no
    longer does (renamed, moved to another table, dropped from the class).
    If such a leftover column was created NOT NULL, every INSERT from the
    current code — which never sets it, because it doesn't know it exists —
    fails with psycopg2.errors.NotNullViolation. This relaxes the constraint
    (without touching data or dropping the column, so it stays reversible)
    for any column present on the live table but absent from the model.
    """
    from sqlalchemy import inspect
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue
            model_cols = {c.name for c in table.columns}
            for col in inspector.get_columns(table.name):
                if col["name"] in model_cols:
                    continue
                if col.get("nullable", True):
                    continue  # already nullable, nothing to fix
                ddl = f'ALTER TABLE {table.name} ALTER COLUMN {col["name"]} DROP NOT NULL'
                try:
                    conn.exec_driver_sql(ddl)
                    print(f"auto-migrate: relaxed orphan NOT NULL on {table.name}.{col['name']}", flush=True)
                except Exception as e:
                    print(f"auto-migrate: failed to relax {table.name}.{col['name']}: {e}", flush=True)


def _backfill_null_defaults():
    """Backfill NULL values on any column that declares a plain Python-side
    `default=` on its model.

    `_auto_migrate_missing_columns()` runs a bare `ALTER TABLE ADD COLUMN`
    with no SQL-level DEFAULT clause, so Postgres leaves every pre-existing
    row's new column NULL — a model's Python-side `default=` only ever
    applies to brand-new INSERTs, never to rows that already existed before
    the column did. Left alone, that silently breaks any endpoint whose
    response schema requires a non-null value for that field. This runs on
    every boot (cheap at this app's scale) and is a no-op once a table has
    no more NULLs left to fill.
    """
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue
            for col in table.columns:
                default = col.default
                if default is None or not getattr(default, "is_scalar", False):
                    continue
                value = default.arg
                if not isinstance(value, (str, int, float, bool)):
                    continue
                try:
                    result = conn.execute(
                        text(f'UPDATE {table.name} SET {col.name} = :v WHERE {col.name} IS NULL'),
                        {"v": value},
                    )
                    if result.rowcount:
                        print(f"auto-migrate: backfilled {result.rowcount} NULL row(s) in {table.name}.{col.name}", flush=True)
                except Exception as e:
                    print(f"auto-migrate: failed to backfill {table.name}.{col.name}: {e}", flush=True)


def init_db():
    """Idempotent schema setup: create missing tables, then backfill any
    columns models.py has gained since a table was first created."""
    t0 = time.time()
    print("init_db: starting schema check ...", flush=True)
    from app import models  # noqa: F401 — register tables on Base.metadata
    Base.metadata.create_all(engine)
    _auto_migrate_missing_columns()
    _relax_orphan_not_null_columns()
    _backfill_null_defaults()
    print(f"init_db: schema ready in {time.time()-t0:.1f}s", flush=True)

    if not DATABASE_URL.startswith("sqlite"):
        return

    with engine.begin() as conn:
        conn.exec_driver_sql(
            "UPDATE weekly_updates SET published_at = created_at WHERE status = 'published' AND published_at IS NULL"
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
