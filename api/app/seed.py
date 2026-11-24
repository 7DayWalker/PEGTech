"""
Demo data seeding for fresh deployments.
"""
from datetime import datetime, date, timedelta
from app.db import SessionLocal, engine, Base
from app import models
from app.security import hash_password
from app.config import ADMIN_EMAIL, ADMIN_PASSWORD


FAQS = [
    ("What services does PEGTech offer?", "We build web applications, AI solutions, digital marketing campaigns, brand identities, and provide tech consulting."),
    ("How long does a typical project take?", "Most projects range from 4 to 12 weeks depending on scope and complexity."),
    ("Do you work with startups?", "Yes! We love working with early-stage companies to build their digital foundations."),
    ("What is your pricing model?", "Project-based pricing with clear milestones. We also offer retainer options for ongoing support."),
    ("Do you provide ongoing support?", "Yes, we offer maintenance and support packages after project launch."),
]

JOBS = [
    ("Senior Full-Stack Engineer", "Remote, Full-time", "Build scalable web applications with our team."),
    ("AI Solutions Architect", "Remote, Full-time", "Design and implement AI systems for clients."),
    ("Account Manager", "Remote, Full-time", "Manage client relationships and project delivery."),
]

LEADS = [
    ("Sarah Jenkins", "referral", "Web Development", "HOT", 15000, 3),
    ("Marcus Chen", "website", "AI Solutions", "WARM", 8000, 1),
    ("Elena Rodriguez", "linkedin", "Digital Marketing", "COLD", 3000, 0),
    ("David Park", "referral", "Brand & Design", "HOT", 12000, 2),
    ("Lisa Thompson", "website", "Tech Consulting", "WARM", 6000, 1),
]

PORTAL_CLIENTS = [
    {
        "company": "Lumière Salon & Spa",
        "contact_name": "Priya Raman",
        "email": "priya@lumiere.com",
        "phone": "+1-555-0101",
        "industry": "Beauty & Wellness",
        "market": "Local",
        "engagement": "Monthly Retainer",
        "campaign": "Spring 2026 Campaign",
        "channels": "['email', 'whatsapp', 'instagram']",
        "kpi_label": "Bookings",
        "status": "active",
        "rag": "green",
        "week_label": "Week 24",
        "progress_pct": 85,
        "strategist": None,
        "delivery_lead": None,
        "success_lead": None,
        "start_date": date(2026, 6, 1),
        "deliverables": [
            ("Instagram campaign", "Week 24", "done", 1),
            ("Email newsletter", "Week 24", "in_progress", 2),
            ("Website refresh", "Week 25", "todo", 3),
        ],
        "updates": [
            ("Week 24", "Strong booking growth", "Bookings up 22% vs last month. Instagram ads performing well.", "published", "Priya Raman"),
        ],
        "documents": [],
        "messages": [
            ("client", "Priya Raman", "The Instagram campaign is doing great! Thanks for the quick turnaround."),
        ],
        "draft_update": ("Week 25", "Draft: Mid-month review", "Draft update for QA review.", "published", "Alex Rivers"),
        "client_login": ("priya@lumiere.com", "demo-client-1", "Priya Raman"),
    },
    {
        "company": "Harbor & Pine Home Services",
        "contact_name": "Jordan Blake",
        "email": "jordan@harborpine.com",
        "phone": "+1-555-0102",
        "industry": "Home Services",
        "market": "Regional",
        "engagement": "Project-based",
        "campaign": "Q3 Growth Push",
        "channels": "['email', 'google_ads']",
        "kpi_label": "Leads",
        "status": "active",
        "rag": "amber",
        "week_label": "Week 24",
        "progress_pct": 60,
        "strategist": None,
        "delivery_lead": None,
        "success_lead": None,
        "start_date": date(2026, 7, 1),
        "deliverables": [
            ("Google Ads setup", "Week 24", "done", 1),
            ("Landing page", "Week 25", "todo", 2),
        ],
        "updates": [
            ("Week 24", "Ads launched", "Google Ads campaigns are live and collecting data.", "published", "Jordan Blake"),
        ],
        "documents": [],
        "messages": [
            ("staff", "Alex Rivers", "Your landing page design is ready for review."),
        ],
        "draft_update": None,
        "client_login": ("jordan@harborpine.com", "demo-client-2", "Jordan Blake"),
    },
]


def run(reset: bool = True):
    if reset:
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)

    db = SessionLocal()
    try:
        # FAQs
        for i, (q, a) in enumerate(FAQS):
            db.add(models.Faq(question=q, answer=a, sort=i))

        # Career roles
        for role, meta, blurb in JOBS:
            db.add(models.CareerRole(role=role, meta=meta, blurb=blurb))

        # Leads
        for name, src, svc, score, value, stage in LEADS:
            db.add(models.Lead(name=name, source=src, service=svc, score=score, value_usd=value, stage=stage))

        # Admin user
        db.add(models.AdminUser(
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            role="owner",
            name="Alex Rivers",
        ))

        # Clients
        for cdata in PORTAL_CLIENTS:
            c = models.Client(**{k: v for k, v in cdata.items() if k in {
                "company", "contact_name", "email", "phone", "industry", "market",
                "engagement", "campaign", "channels", "kpi_label", "status", "rag",
                "week_label", "progress_pct", "start_date",
            }})
            db.add(c)
            db.flush()
            for title, due, status, sort in cdata["deliverables"]:
                db.add(models.Deliverable(client_id=c.id, title=title, due_label=due, status=status, sort=sort))
            for week, headline, body, status, entered_by in cdata["updates"]:
                db.add(models.WeeklyUpdate(client_id=c.id, week_label=week, headline=headline, body=body,
                                           status=status, entered_by=entered_by, published_at=datetime.utcnow()))
            for sender, author, body in cdata["messages"]:
                db.add(models.ClientMessage(client_id=c.id, sender=sender, author=author, body=body))
            login_email, login_pw, login_name = cdata["client_login"]
            db.add(models.ClientUser(
                client_id=c.id, name=login_name, email=login_email,
                password_hash=hash_password(login_pw),
            ))

        db.commit()
        print("seeded: FAQs, roles, leads, admin, clients, demo data")
    finally:
        db.close()


if __name__ == "__main__":
    run()
