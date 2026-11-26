/** Site footer — dark charcoal theme with Gemini gradient accents. */
import { Link } from "react-router-dom";
import { Mail, Globe } from "lucide-react";
import { Container } from "./Section";
import logoMark from "../assets/brand/pegtech-icon-mark.png";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-dark-900 mt-auto pt-16 pb-8">
      <Container>
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight mb-1">
              <img src={logoMark} alt="PEGTech" className="h-9 w-9 object-contain" />
              <span>PEG<span className="text-gradient">Tech</span></span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-6 ml-11">
              A Paul Edison Group Company
            </p>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Web applications, AI solutions, and digital services for modern
              businesses. Nigeria-based, WhatsApp-first, built for growth.
            </p>
            <div className="mt-6 flex flex-col gap-3 text-sm">
              <a
                href="https://wa.me/2348012345678"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit"
              >
                <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[8px] font-bold text-white">W</span>
                WhatsApp (Meta-verified)
              </a>
              <a
                href="mailto:hello@pegtech.co"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit"
              >
                <Mail size={16} /> hello@pegtech.co
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Services</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link to="/services#web" className="hover:text-white transition-colors">Web Development</Link></li>
              <li><Link to="/services#app" className="hover:text-white transition-colors">Mobile Apps</Link></li>
              <li><Link to="/services#ai" className="hover:text-white transition-colors">AI Solutions</Link></li>
              <li><Link to="/services#marketing" className="hover:text-white transition-colors">Digital Marketing</Link></li>
              <li><Link to="/services#design" className="hover:text-white transition-colors">Brand & Design</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Company</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/work" className="hover:text-white transition-colors">Our Work</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between gap-4 items-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} PEGTech. Lagos, Nigeria. Built for modern businesses.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Globe size={14} /> Serving clients worldwide
          </div>
        </div>
        <p className="text-[11px] text-slate-600 text-center sm:text-left mt-3">
          PEGTech is a trading name of PAUL EDISON LIMITED (RC 1833166).
        </p>
      </Container>
    </footer>
  );
}
