import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/projects", label: "Projects" },
  { to: "/publications", label: "Publications" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Every page opens on a dark photo banner, so the header starts transparent everywhere
  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "bg-ink/95 shadow-lg shadow-ink/20 backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="container-site flex h-20 items-center justify-between gap-6">
        <Link to="/" className="shrink-0" aria-label="Prof. Thomas Kivevele, home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-[15px] font-medium transition-colors ${
                  isActive ? "text-solar" : "text-white/85 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link to="/contact" className="btn-solar ml-3 min-h-11 px-5 text-sm">
            Book a talk or partnership
          </Link>
        </nav>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-white/10 bg-ink lg:hidden">
          <div className="container-site flex flex-col py-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-3.5 text-lg font-medium ${isActive ? "text-solar" : "text-white"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link to="/contact" className="btn-solar mt-3">
              Book a talk or partnership
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
