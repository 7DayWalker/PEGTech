/** Top navigation — marketing site style. */
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { api } from "../lib/api";

export function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  async function handleLogout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    }
    window.location.href = "/";
  }

  const isAuthPage = location.pathname.startsWith("/signin") || location.pathname === "/signup";

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-dark-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight"
          >
            <span className="text-blue-500">P</span>EG<span className="text-white">Tech</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/services" className="text-slate-400 hover:text-white transition-colors">
              Services
            </Link>
            <Link to="/work" className="text-slate-400 hover:text-white transition-colors">
              Work
            </Link>
            <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {!isAuthPage && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
            <Link to="/book" className="btn-primary text-xs px-3 py-1.5 hidden md:block">
              Book a Call
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-slate-400"
              aria-label="Open menu"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden bg-dark-800 border-t border-border/50 p-4 space-y-3">
            <Link
              to="/"
              className="block px-3 py-2 text-slate-400 hover:text-white transition-colors rounded-lg"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/services"
              className="block px-3 py-2 text-slate-400 hover:text-white transition-colors rounded-lg"
              onClick={() => setOpen(false)}
            >
              Services
            </Link>
            <Link
              to="/work"
              className="block px-3 py-2 text-slate-400 hover:text-white transition-colors rounded-lg"
              onClick={() => setOpen(false)}
            >
              Work
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2 text-slate-400 hover:text-white transition-colors rounded-lg"
              onClick={() => setOpen(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="block px-3 py-2 text-slate-400 hover:text-white transition-colors rounded-lg"
              onClick={() => setOpen(false)}
            >
              Contact
            </Link>
            <Link
              to="/book"
              className="block px-3 py-2 bg-blue-600 text-white rounded-xl text-center font-medium hover:bg-blue-500 transition-colors"
              onClick={() => setOpen(false)}
            >
              Book a Call
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2 rounded-lg"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
