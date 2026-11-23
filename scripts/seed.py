"""
Optional seed script to populate default niches.
Run with: python scripts/seed.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import Niche
from app.config import settings


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        default_niches = [
            {"name": "Roofing", "slug": "roofing", "description": "Roofing contractors and repair services"},
            {"name": "Plumbing", "slug": "plumbing", "description": "Plumbing services and repair"},
            {"name": "HVAC", "slug": "hvac", "description": "Heating, ventilation, and air conditioning"},
            {"name": "Electrical", "slug": "electrical", "description": "Electrical contracting and repair"},
            {"name": "Landscaping", "slug": "landscaping", "description": "Lawn care and landscaping services"},
        ]

        for n in default_niches:
            existing = db.query(Niche).filter(Niche.slug == n["slug"]).first()
            if not existing:
                db.add(Niche(**n))
        db.commit()
        print("✓ Seeded default niches")
    finally:
        db.close()


if __name__ == "__main__":
    seed()