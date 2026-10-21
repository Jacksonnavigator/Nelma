import { useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Projects from "./pages/Projects";
import Publications from "./pages/Publications";
import Contact from "./pages/Contact";

const titles: Record<string, string> = {
  "/": "Prof. Thomas Kivevele | Sustainable Energy Engineering",
  "/about": "About | Prof. Thomas Kivevele",
  "/projects": "Research projects | Prof. Thomas Kivevele",
  "/publications": "Publications | Prof. Thomas Kivevele",
  "/contact": "Contact | Prof. Thomas Kivevele",
};

function NotFound() {
  return (
    <section className="grid min-h-[70vh] place-items-center bg-ink px-4 pt-20 text-center text-white">
      <div>
        <h1 className="text-5xl font-semibold">This page does not exist</h1>
        <p className="mt-4 text-white/75">The link may be old or mistyped.</p>
        <Link to="/" className="btn-solar mt-8">Go to the home page</Link>
      </div>
    </section>
  );
}

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = titles[pathname] ?? "Prof. Thomas Kivevele";
  }, [pathname]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
