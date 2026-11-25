/** Floating frosted-glass pill navigation bar. */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import logoMark from "../assets/brand/pegtech-icon-mark.png";
import { useAuth } from "../lib/AuthContext";

export function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAuthPage = location.pathname.startsWith("/signin") || location.pathname === "/signup";

  function handleSignOut() {
    logout();
    setOpen(false);
    navigate("/");
  }

  const links = [
    { to: "/", label: "Home" },
    { to: "/services", label: "Services" },
    { to: "/work", label: "Work" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <div className="sticky top-4 z-50 px-4">
      <nav className="nav-pill max-w-5xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0">
            <img src={logoMark} alt="PEGTech" className="h-8 w-8 object-contain" />
            <span>PEG<span className="text-gradient">Tech</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-1 text-sm font-medium">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 rounded-full transition-colors ${
                  location.pathname === l.to
                    ? "text-white bg-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!isAuthPage && user && (
              <div className="hidden md:flex items-center gap-3">
                {user.typ === "staff" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    <LayoutDashboard size={15} />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
            {!isAuthPage && !user && (
              <Link to="/signin" className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors">
                Sign in
              </Link>
            )}
            <Link to="/book" className="btn-primary text-xs px-4 py-2 hidden md:inline-flex">
              Book a Call
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-slate-300"
              aria-label="Open menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-white/10 p-4 space-y-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="block px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/book"
              className="block mt-2 px-4 py-2.5 bg-gemini-gradient text-white rounded-xl text-center font-semibold"
              onClick={() => setOpen(false)}
            >
              Book a Call
            </Link>
            {user ? (
              <>
                {user.typ === "staff" && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2.5 text-slate-400 hover:text-white text-center transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="block w-full px-4 py-2.5 text-slate-400 hover:text-white text-center transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/signin"
                className="block px-4 py-2.5 text-slate-400 hover:text-white text-center transition-colors"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
