/**
 * Home page — landing page with hero, services, and CTA.
 */
import { useTitle } from "../lib/useTitle"
import { ChatWidget } from "../components/ChatWidget"
import { ThemeToggle } from "../components/ThemeToggle"
import { SERVICES } from "../lib/content"

export function Home() {
  useTitle("PEGTech — Build Smarter. Grow Faster.")

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="text-accent">P</span>EG<span className="text-primary">Tech</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/services" className="text-muted hover:text-accent transition-colors">Services</Link>
              <Link to="/book" className="text-muted hover:text-accent transition-colors">Book a Call</Link>
              <Link to="/audit" className="text-muted hover:text-accent transition-colors">AI Audit</Link>
              <Link to="/careers" className="text-muted hover:text-accent transition-colors">Careers</Link>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/book" className="btn">Book a Call</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-text mb-6 tracking-tight">
              Build smarter.{" "}
              <span className="text-accent">Grow faster.</span>
            </h1>
            <p className="text-lg text-muted mb-8 max-w-2xl mx-auto">
              Web applications, AI solutions, and digital services for modern businesses.
              AI-powered customer service, lead scoring, and project delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/book" className="btn w-full sm:w-auto">Book a Consultation</Link>
              <Link to="/services" className="btn-ghost w-full sm:w-auto">View Services</Link>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text mb-3">Our Services</h2>
              <p className="text-muted">Everything you need to grow your business online.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {SERVICES.map((s) => (
                <div key={s.name} className="card p-6">
                  <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center text-accent mb-4">
                    <span className="text-lg">{s.icon === "globe" ? "🌐" : s.icon === "cpu" ? "🤖" : s.icon === "megaphone" ? "📢" : s.icon === "palette" ? "🎨" : "💼"}</span>
                  </div>
                  <h3 className="text-lg font-bold text-text mb-2">{s.name}</h3>
                  <p className="text-muted text-sm">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Features */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text mb-3">AI-Powered Delivery</h2>
              <p className="text-muted">AI isn't an add-on — it's built into how we work.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "AI CSR", desc: "AI customer service rep that handles first contact before a human joins." },
                { name: "AI Email Drafting", desc: "Personalized outreach emails written in seconds, not hours." },
                { name: "AI Call Summarization", desc: "Call transcripts turned into action items and summaries." },
              ].map((f) => (
                <div key={f.name} className="card p-6">
                  <h3 className="text-lg font-bold text-text mb-2">{f.name}</h3>
                  <p className="text-muted text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-input bg-primary text-muted mt-auto pt-10 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-white">
              <span className="text-accent">P</span>EG<span className="text-white">Tech</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/services" className="hover:text-white transition-colors">Services</Link>
              <Link to="/book" className="hover:text-white transition-colors">Book</Link>
              <Link to="/careers" className="hover:text-white transition-colors">Careers</Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted/60 text-center">
            © {new Date().getFullYear()} PEGTech. Built for modern businesses.
          </p>
        </div>
      </footer>

      <ChatWidget />
    </div>
  )
}

import { Link } from "react-router-dom"
