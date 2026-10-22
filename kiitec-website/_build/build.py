"""Builds the KIITEC site: wraps each page in _build/pages/ with the shared header and footer.

Run from anywhere:  python3 kiitec-website/_build/build.py
Output: one .html file per page in kiitec-website/.
"""
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
SITE = "https://kiitec.ac.tz"
IMG = SITE + "/images/legacy"

NAV = [
    ("programmes.html", "Programmes"),
    ("admissions.html", "Admissions"),
    ("scholarships.html", "Scholarships & news"),
    ("campus.html", "Campus"),
    ("about.html", "About"),
    ("contact.html", "Contact"),
]

LAYOUT = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<meta name="theme-color" content="#8f1528">
<link rel="canonical" href="{site}/{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Don Bosco KIITEC">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{site}/{canonical}">
<meta property="og:image" content="{og_image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{site}/images/KIITEC-LOGO.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap">
<link rel="stylesheet" href="assets/styles.css">
{head_extra}</head>
<body>
<a class="skip" href="#main">Skip to main content</a>

<div class="topbar">
  <div class="wrap">
    <span class="topbar-reg">NACTVET registered technical institute, REG/EOS/027</span>
    <span class="topbar-links">
      <a href="tel:+255716752102">+255 716 752 102</a>
      <a href="https://sis.kiitec.ac.tz/login">Student login</a>
    </span>
  </div>
</div>

<header class="site-header">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="Don Bosco KIITEC home">
      <img src="{img}/2023/06/cropped-KIITEC-LOGO-300x146.png" alt="" width="92" height="45">
      <span class="brand-text">
        <span class="brand-name">Don Bosco KIITEC</span>
        <span class="brand-sub">Arusha, Tanzania</span>
      </span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
      <span></span><span class="visually-hidden">Menu</span>
    </button>
    <nav class="nav" id="site-nav" aria-label="Main">
{nav}
      <a class="btn btn-primary" href="admissions.html#apply">Apply now</a>
    </nav>
  </div>
</header>

<main id="main">
{body}
</main>

<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="{img}/2023/06/cropped-KIITEC-LOGO-300x146.png" alt="Don Bosco KIITEC" width="120" height="58">
        <p>Don Bosco Kilimanjaro International Institute for Telecommunications, Electronics and Computers. A Salesian technical institute in Suye, Arusha, registered by NACTVET (REG/EOS/027).</p>
      </div>
      <div>
        <h2>Study</h2>
        <ul>
          <li><a href="programmes.html">Diploma programmes</a></li>
          <li><a href="programmes.html#short-courses">Professional and short courses</a></li>
          <li><a href="admissions.html">How to apply</a></li>
          <li><a href="scholarships.html">Scholarships</a></li>
        </ul>
      </div>
      <div>
        <h2>Institute</h2>
        <ul>
          <li><a href="about.html">About KIITEC</a></li>
          <li><a href="campus.html">Campus and labs</a></li>
          <li><a href="campus.html#gallery">Photo gallery</a></li>
          <li><a href="https://sis.kiitec.ac.tz/login">Student login</a></li>
        </ul>
      </div>
      <div>
        <h2>Contact</h2>
        <ul>
          <li><a href="tel:+255272504384">+255 27 250 4384</a></li>
          <li><a href="tel:+255716752102">+255 716 752 102</a> (Registrar)</li>
          <li><a href="mailto:info@kiitec.ac.tz">info@kiitec.ac.tz</a></li>
          <li><a href="https://www.instagram.com/kiitecinstitute/">Instagram @kiitecinstitute</a></li>
          <li>P.O. Box 3172, Arusha</li>
        </ul>
      </div>
    </div>
    <div class="footer-base">
      <span>&copy; <span data-year>2026</span> Don Bosco KIITEC. All rights reserved.</span>
      <span>No payment is ever required to apply for a KIITEC scholarship.</span>
    </div>
  </div>
</footer>
<script src="assets/site.js" defer></script>
</body>
</html>
"""


def nav_html(current):
    lines = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == current else ""
        lines.append(f'      <a href="{href}"{cur}>{label}</a>')
    return "\n".join(lines)


def build():
    for src in sorted((HERE / "pages").glob("*.html")):
        text = src.read_text(encoding="utf-8")
        meta = dict(re.findall(r"^<!--\s*(\w+):\s*(.*?)\s*-->$", text, flags=re.M))
        body = re.sub(r"^<!--\s*\w+:.*?-->\n", "", text, flags=re.M)
        name = src.name
        page = LAYOUT.format(
            title=meta["title"],
            description=meta["description"],
            canonical="" if name == "index.html" else name,
            og_image=meta.get("og_image", f"{IMG}/2025/05/new5-1024x683.jpg"),
            head_extra="",
            site=SITE,
            img=IMG,
            nav=nav_html(name),
            body=body.replace("{IMG}", IMG).rstrip(),
        )
        (OUT / name).write_text(page, encoding="utf-8")
        print("built", name)


if __name__ == "__main__":
    build()
