"""
Preview site generator.
Generates self-contained HTML preview pages for any niche (roofing, plumbing, HVAC, etc.).
All CSS is inlined; images use embedded placeholders (no external dependencies).
"""
from html import escape
from typing import Optional

from app.config import settings


# Niche-specific service descriptions
NICHE_SERVICES: dict[str, list[dict]] = {
    "roofing": [
        {"title": "Roof Installation", "desc": "Complete roof replacement with premium materials and expert installation."},
        {"title": "Roof Repair", "desc": "Fast, reliable repairs for leaks, storm damage, and wear."},
        {"title": "Gutter Services", "desc": "Protect your home with seamless gutter systems."},
        {"title": "Storm Damage", "desc": "Emergency tarping and full restoration after severe weather."},
        {"title": "Roof Inspection", "desc": "Schedule a comprehensive roof health check today."},
        {"title": "Commercial Roofing", "desc": "Flat roofs, metal systems, and commercial maintenance."},
    ],
    "plumbing": [
        {"title": "Pipe Repair", "desc": "Fast leak detection and pipe replacement."},
        {"title": "Water Heater", "desc": "Installation and repair of tank and tankless systems."},
        {"title": "Drain Cleaning", "desc": "Professional drain clearing and hydro jetting."},
        {"title": "Bathroom Remodel", "desc": "Complete bathroom plumbing and fixture upgrades."},
        {"title": "Emergency Plumbing", "desc": "24/7 emergency response for burst pipes and floods."},
    ],
    "hvac": [
        {"title": "AC Installation", "desc": "Central air conditioning installation and replacement."},
        {"title": "Heating Repair", "desc": "Furnace and heat pump repair and maintenance."},
        {"title": "Duct Cleaning", "desc": "Professional air duct cleaning for better indoor air quality."},
        {"title": "HVAC Maintenance", "desc": "Seasonal tune-ups to keep your system running efficiently."},
        {"title": "Thermostat Upgrade", "desc": "Smart thermostat installation and programming."},
    ],
    "electrical": [
        {"title": "Panel Upgrade", "desc": "Electrical panel replacement and upgrade services."},
        {"title": "Wiring Repair", "desc": "Faulty wiring diagnosis and repair."},
        {"title": "Lighting Installation", "desc": "Interior and exterior lighting installation."},
        {"title": "Generator Install", "desc": "Whole-home backup generator installation."},
        {"title": "Electrical Safety", "desc": "Home safety inspections and code compliance."},
    ],
    "landscaping": [
        {"title": "Lawn Maintenance", "desc": "Weekly mowing, edging, and cleanup."},
        {"title": "Tree Service", "desc": "Tree trimming, removal, and stump grinding."},
        {"title": "Irrigation", "desc": "Sprinkler system installation and repair."},
        {"title": "Hardscaping", "desc": "Patios, walkways, and retaining walls."},
        {"title": "Seasonal Cleanup", "desc": "Spring and fall yard cleanup services."},
    ],
}

NICHE_COLORS: dict[str, str] = {
    "roofing": "#c2410c",
    "plumbing": "#0ea5e9",
    "hvac": "#3b82f6",
    "electrical": "#f59e0b",
    "landscaping": "#22c55e",
}


def get_services_for_niche(niche_name: str | None) -> list[dict]:
    """Return service cards for a given niche, or generic ones."""
    key = (niche_name or "").lower().strip()
    return NICHE_SERVICES.get(key, [
        {"title": "Service 1", "desc": "Professional service description goes here."},
        {"title": "Service 2", "desc": "Expert solutions for your needs."},
        {"title": "Service 3", "desc": "Quality workmanship guaranteed."},
        {"title": "Service 4", "desc": "Fast, reliable, and affordable."},
    ])


def generate_preview_html(
    business_name: str,
    niche_name: str | None = None,
    phone: Optional[str] = None,
    address: Optional[str] = None,
    rating: Optional[float] = None,
    review_count: Optional[int] = None,
    service_area: Optional[str] = None,
    slug: Optional[str] = None,
    preview_base_url: Optional[str] = None,
) -> str:
    """Generate a self-contained HTML preview page for any business niche."""
    base = preview_base_url or settings.preview_base_url or ""
    name = escape(business_name or "Business")
    phone_text = escape(phone or "")
    address_text = escape(address or "")
    city = escape(address.split(",")[0]) if address else ""
    rating_str = f"{rating:.1f}" if rating is not None else "5.0"
    reviews_str = str(review_count) if review_count is not None else "0"
    area = escape(service_area or city or "Local Area")
    slug_text = escape(slug or business_name.lower().replace(" ", "-"))
    accent = NICHE_COLORS.get((niche_name or "").lower().strip(), "#fbbf24")
    services = get_services_for_niche(niche_name)

    service_cards = ""
    for s in services:
        service_cards += f"""
      <div class="card">
        <div class="placeholder-img">{escape(s['title'])}</div>
        <h3>{escape(s['title'])}</h3>
        <p>{escape(s['desc'])}</p>
      </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{name} | Professional {escape(niche_name or 'Services')}</title>
<meta name="description" content="{name} — trusted {escape(niche_name or 'services')} provider serving {area}. {reviews_str} reviews, {rating_str}-star rating.">
<meta name="robots" content="noindex,nofollow">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; }}
  .container {{ max-width: 1200px; margin: 0 auto; padding: 0 20px; }}
  header {{ background: #111827; color: #fff; padding: 1.5rem 0; position: sticky; top: 0; z-index: 100; }}
  .nav {{ display: flex; justify-content: space-between; align-items: center; }}
  .logo {{ font-size: 1.5rem; font-weight: 700; letter-spacing: -0.5px; }}
  .nav-links {{ display: none; gap: 2rem; }}
  @media (min-width: 768px) {{ .nav-links {{ display: flex; }} }}
  .nav-links a {{ color: #fff; text-decoration: none; font-size: 0.95rem; }}
  .nav-links a:hover {{ color: {accent}; }}
  .accent {{ color: {accent}; }}
  .hero {{ background: linear-gradient(135deg, #111827 0%, #374151 100%); color: #fff; padding: 5rem 0; text-align: center; }}
  .hero h1 {{ font-size: 2.5rem; margin-bottom: 1rem; }}
  @media (min-width: 768px) {{ .hero h1 {{ font-size: 3.5rem; }} }}
  .hero p {{ font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.95; }}
  .badge {{ display: inline-block; background: {accent}; color: #111827; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 700; margin: 0.25rem; }}
  .cta-btn {{ background: {accent}; color: #111827; border: none; padding: 1rem 2rem; font-size: 1.1rem; font-weight: 700; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-block; }}
  .cta-btn:hover {{ opacity: 0.9; }}
  .section {{ padding: 4rem 0; }}
  .section h2 {{ font-size: 2rem; margin-bottom: 1.5rem; text-align: center; }}
  .grid {{ display: grid; grid-template-columns: 1fr; gap: 1.5rem; }}
  @media (min-width: 768px) {{ .grid {{ grid-template-columns: repeat(3, 1fr); }} }}
  .card {{ background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
  .card h3 {{ margin-bottom: 0.5rem; }}
  .info-grid {{ display: grid; grid-template-columns: 1fr; gap: 1rem; margin-top: 1rem; }}
  @media (min-width: 768px) {{ .info-grid {{ grid-template-columns: repeat(2, 1fr); }} }}
  .info-item {{ background: #f3f4f6; padding: 1rem; border-radius: 6px; }}
  .info-item strong {{ color: #111827; }}
  .placeholder-img {{ background: #e5e7eb; height: 200px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem; }}
  footer {{ background: #111827; color: #9ca3af; padding: 2rem 0; text-align: center; font-size: 0.9rem; }}
  footer a {{ color: {accent}; text-decoration: none; }}
  .disclaimer {{ font-size: 0.8rem; color: #6b7280; margin-top: 1rem; }}
</style>
</head>
<body>
<header>
  <div class="container nav">
    <div class="logo">{name}</div>
    <nav class="nav-links">
      <a href="#services">Services</a>
      <a href="#projects">Projects</a>
      <a href="#reviews">Reviews</a>
      <a href="#contact">Quote</a>
    </nav>
  </div>
</header>

<section class="hero">
  <div class="container">
    <h1>{name}</h1>
    <p>Professional {escape(niche_name or 'services')} in {area}. Free estimates, quality workmanship, guaranteed satisfaction.</p>
    <div>
      <span class="badge">{rating_str}★ {reviews_str} reviews</span>
      <span class="badge">{phone_text}</span>
    </div>
    <br>
    <a href="#contact" class="cta-btn">Get a Free Quote</a>
  </div>
</section>

<section id="services" class="section">
  <div class="container">
    <h2>Our Services</h2>
    <div class="grid">{service_cards}</div>
  </div>
</section>

<section id="projects" class="section">
  <div class="container">
    <h2>Recent Projects</h2>
    <div class="grid">
      <div class="card">
        <div class="placeholder-img">Project Gallery</div>
        <h3>Completed Project</h3>
        <p>Quality workmanship on a recent job.</p>
      </div>
      <div class="card">
        <div class="placeholder-img">Project Gallery</div>
        <h3>Before & After</h3>
        <p>See the transformation we delivered.</p>
      </div>
      <div class="card">
        <div class="placeholder-img">Project Gallery</div>
        <h3>Customer Installation</h3>
        <p>Professional installation by our team.</p>
      </div>
    </div>
  </div>
</section>

<section id="reviews" class="section" style="background: #f3f4f6;">
  <div class="container">
    <h2>What Our Customers Say</h2>
    <div class="grid">
      <div class="card">
        <p>"{name} did an amazing job. Highly recommend!"</p>
        <p style="font-size:0.9rem;color:#6b7280;text-align:right;">— Satisfied Customer</p>
      </div>
      <div class="card">
        <p>"Fast, professional, and fair pricing. Would use again."</p>
        <p style="font-size:0.9rem;color:#6b7280;text-align:right;">— Happy Client</p>
      </div>
      <div class="card">
        <p>"Great communication from start to finish. 5 stars!"</p>
        <p style="font-size:0.9rem;color:#6b7280;text-align:right;">— Local Business Owner</p>
      </div>
    </div>
  </div>
</section>

<section id="contact" class="section">
  <div class="container">
    <h2>Get a Free Quote</h2>
    <div class="info-grid">
      <div class="info-item">
        <strong>Business:</strong> {name}<br>
        <strong>Phone:</strong> {phone_text}<br>
        <strong>Address:</strong> {address_text}<br>
        <strong>Service Area:</strong> {area}<br>
        <strong>Rating:</strong> {rating_str}★ ({reviews_str} reviews)
      </div>
      <div class="info-item">
        <form>
          <div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:0.25rem;">Name</label><input type="text" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:4px;" required></div>
          <div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:0.25rem;">Email</label><input type="email" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:4px;" required></div>
          <div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:0.25rem;">Phone</label><input type="tel" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:4px;" required></div>
          <div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:0.25rem;">Message</label><textarea style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:4px;" required></textarea></div>
          <button type="submit" class="cta-btn" style="width:100%;">Send Message</button>
        </form>
        <p class="disclaimer">This is a free preview site. Reply to the outreach message to claim your site.</p>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="container">
    <p>&copy; 2026 {name}. All rights reserved.</p>
    <p class="disclaimer">Generated preview — contact the business owner to claim and publish on your own domain.</p>
  </div>
</footer>
</body>
</html>"""
    return html