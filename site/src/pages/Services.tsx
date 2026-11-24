/**
 * Services page.
 */
import { Link } from "react-router-dom"
import { useTitle } from "../lib/useTitle"
import { SERVICES } from "../lib/content"
import { ChatWidget } from "../components/ChatWidget"

export function Services() {
  useTitle("Services — PEGTech")

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="text-accent">P</span>EG<span className="text-primary">Tech</span>
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <Link to="/" className="text-muted hover:text-accent transition-colors">← Back to Home</Link>
              <Link to="/book" className="btn">Book a Call</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-text mb-8">Our Services</h1>
          <div className="space-y-6">
            {SERVICES.map((s) => (
              <div key={s.name} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-text">{s.name}</h3>
                  <span className="text-accent font-semibold">Starting at $2,500</span>
                </div>
                <p className="text-muted mb-4">{s.description}</p>
                <ul className="space-y-2 text-sm text-muted">
                  <li>• Discovery & requirements gathering</li>
                  <li>• Design & prototyping</li>
                  <li>• Development & QA</li>
                  <li>• Launch & post-launch support</li>
                </ul>
                <Link to="/book" className="mt-4 inline-block text-accent font-medium hover:underline">
                  Book this service →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-input bg-primary text-muted mt-auto pt-10 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <p className="mt-4 text-xs text-muted/60 text-center">
            © {new Date().getFullYear()} PEGTech. Built for modern businesses.
          </p>
        </div>
      </footer>

      <ChatWidget />
    </div>
  )
}
