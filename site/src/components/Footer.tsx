/** Site footer. */
import { Link } from "react-router-dom";
import { Mail, Phone, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-dark-900 mt-auto pt-16 pb-8">
      <Container>
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight mb-6">
              <span className="text-accent">P</span>EG<span className="text-white">Tech</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Web applications, AI solutions, and digital services for modern
              businesses. Nigeria-based, WhatsApp-first, built for growth.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-white transition-colors">
                  Book a Call
                </Link>
              </li>
              <li>
                <Link to="/audit" className="hover:text-white transition-colors">
                  AI Audit
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Mail size={16} /> hello@pegtech.co
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} /> +1 (555) 0100
              </li>
              <li className="flex items-center gap-2">
                <Globe size={16} /> Lagos, Nigeria
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 pt-8">
          <p className="text-xs text-slate-500 text-center">
            © {new Date().getFullYear()} PEGTech. Built for modern businesses.
          </p>
        </div>
      </Container>
    </footer>
  );
}

import { Container } from "./Section";
