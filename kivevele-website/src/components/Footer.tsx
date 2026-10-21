import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import Logo from "./Logo";
import { contact } from "../data/site";

export default function Footer() {
  return (
    <footer className="bg-ink text-white/70">
      <div className="container-site grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-6 max-w-sm leading-relaxed">
            Associate Professor of Sustainable Energy Engineering and Director of Research and Innovation at the Nelson Mandela
            African Institution of Science and Technology.
          </p>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold text-white">Explore</h2>
          <ul className="mt-4 space-y-3">
            {[
              ["/about", "About"],
              ["/projects", "Research projects"],
              ["/publications", "Publications"],
              ["/contact", "Contact"],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="hover:text-solar">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold text-white">Contact</h2>
          <ul className="mt-4 space-y-4">
            <li className="flex gap-3">
              <Mail size={18} className="mt-0.5 shrink-0 text-solar" aria-hidden="true" />
              <a href={`mailto:${contact.emailPrimary}`} className="break-all hover:text-solar">
                {contact.emailPrimary}
              </a>
            </li>
            <li className="flex gap-3">
              <Phone size={18} className="mt-0.5 shrink-0 text-solar" aria-hidden="true" />
              <a href={`tel:${contact.phones[0].replace(/\s/g, "")}`} className="hover:text-solar">
                {contact.phones[0]}
              </a>
            </li>
            <li className="flex gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-solar" aria-hidden="true" />
              <span>NM-AIST, Nelson Mandela Road, Arusha, Tanzania</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-2 py-6 text-sm sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Prof. Thomas T. Kivevele. All rights reserved.</p>
          <p>Photography: Unsplash contributors</p>
        </div>
      </div>
    </footer>
  );
}
