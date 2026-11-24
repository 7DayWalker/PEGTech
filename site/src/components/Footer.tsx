/** Site footer — dark theme with blue accent. */
import { Link } from "react-router-dom";
import { Mail, Phone, Globe } from "lucide-react";
import { Container } from "./Section";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-dark-900 mt-auto pt-16 pb-8">
      <Container>
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight mb-6">
              <span className="text-blue-500">P</span>EG<span className="text-white">Tech</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Web applications, AI solutions, and digital services for modern
              businesses. Nigeria-based, WhatsApp-first, built for growth.
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href="https://wa.me/2348012345678"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">WhatsApp</span>
                WhatsApp
              </a>
              <a
                href="mailto:hello@pegtech.co"
                className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Mail size={16} /> hello@pegtech.co
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 mb-4">Services</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link to="/services#web" className="hover:text-blue-400 transition-colors">
                  Web Development
                </Link>
              </li>
              <li>
                <Link to="/services#app" className="hover:text-blue-400 transition-colors">
                  Mobile Apps
                </Link>
              </li>
              <li>
                <Link to="/services#ai" className="hover:text-blue-400 transition-colors">
                  AI Solutions
                </Link>
              </li>
              <li>
                <Link to="/services#marketing" className="hover:text-blue-400 transition-colors">
                  Digital Marketing
                </Link>
              </li>
              <li>
                <Link to="/services#design" className="hover:text-blue-400 transition-colors">
                  Brand & Design
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link to="/about" className="hover:text-blue-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/work" className="hover:text-blue-400 transition-colors">
                  Our Work
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-3">
                <Globe size={16} className="text-blue-500" />
                <span>Lagos, Nigeria</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-blue-500" />
                <span>+234 801 234 5678</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-blue-500" />
                <span>hello@pegtech.co</span>
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
