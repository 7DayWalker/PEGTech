/**
 * Site footer.
 */
import { Link } from "react-router-dom"
import { Mail, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-input bg-primary text-muted mt-auto pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-text">
            <span className="text-accent">P</span>EG<span className="text-text">Tech</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/" className="hover:text-text transition-colors">Home</Link>
            <Link to="/services" className="hover:text-text transition-colors">Services</Link>
            <Link to="/book" className="hover:text-text transition-colors">Book</Link>
            <Link to="/careers" className="hover:text-text transition-colors">Careers</Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Mail size={16} /> hello@pegtech.co
            </div>
            <div className="flex items-center gap-1">
              <Phone size={16} /> +1 (555) 0100
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted/60 text-center">
          © {new Date().getFullYear()} PEGTech. Built for modern businesses.
        </p>
      </div>
    </footer>
  )
}
