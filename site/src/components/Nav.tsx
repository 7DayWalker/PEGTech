/**
 * Top navigation with auth state and mobile menu.
 */
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X, LogOut } from "lucide-react"
import { api } from "../lib/api"

export function Nav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  async function handleLogout() {
    try {
      await api.post("/api/auth/logout")
    } catch {
      // ignore
    }
    window.location.href = "/"
  }

  const isAuthPage = location.pathname.startsWith("/signin") || location.pathname === "/signup"

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="text-accent">P</span>EG<span className="text-primary">Tech</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="text-muted hover:text-accent transition-colors">Home</Link>
            <Link to="/services" className="text-muted hover:text-accent transition-colors">Services</Link>
            <Link to="/book" className="text-muted hover:text-accent transition-colors">Book a Call</Link>
            <Link to="/audit" className="text-muted hover:text-accent transition-colors">AI Audit</Link>
            <Link to="/careers" className="text-muted hover:text-accent transition-colors">Careers</Link>
          </div>

          <div className="flex items-center gap-3">
            {!isAuthPage && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <button
                  onClick={handleLogout}
                  className="text-muted hover:text-accent transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
            <Link
              to={isAuthPage ? "/" : "/client-portal"}
              className="btn btn-ghost hidden md:block"
            >
              {isAuthPage ? "Back to Home" : "Client Portal"}
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-muted"
              aria-label="Open menu"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden bg-card border-t border-input p-4">
            <Link to="/" className="block px-3 py-2 text-muted hover:text-accent transition-colors" onClick={() => setOpen(false)}>
              Home
            </Link>
            <Link to="/services" className="block px-3 py-2 text-muted hover:text-accent transition-colors" onClick={() => setOpen(false)}>
              Services
            </Link>
            <Link to="/book" className="block px-3 py-2 text-muted hover:text-accent transition-colors" onClick={() => setOpen(false)}>
              Book a Call
            </Link>
            <Link to="/audit" className="block px-3 py-2 text-muted hover:text-accent transition-colors" onClick={() => setOpen(false)}>
              AI Audit
            </Link>
            <Link to="/careers" className="block px-3 py-2 text-muted hover:text-accent transition-colors" onClick={() => setOpen(false)}>
              Careers
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-muted hover:text-accent transition-colors flex items-center gap-2"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
