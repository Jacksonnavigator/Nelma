import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Apple, Building2, Check, Clock3, CreditCard, Download, Droplets, Facebook, History, Instagram, Mail, MapPin, MessageCircle, PackageCheck, Phone, Play, Recycle, ShieldCheck, Smartphone, Truck, Twitter, X } from "lucide-react";

const heroBottleAsset = { url: "/media/nelma-branded-two-bottles.png" };
const plantRo = { url: "/media/DSC_0872.jpg" };
const plantTanks = { url: "/media/DSC_0874.jpg" };
const plantStore = { url: "/media/DSC_0882.jpg" };
const plantLine = { url: "/media/DSC_0884.jpg" };
const plantFilling = { url: "/media/DSC_0885.jpg" };
const plantCapping = { url: "/media/DSC_0886.jpg" };
const plantHall = { url: "/media/DSC_0887.jpg" };
const productImageAsset = { url: "/media/nelma-branded-single-bottle.png" };

// Brand images live in public/ so the site works on any host, not only on Lovable.
// The logo is the same Nelma wordmark as the app (transparent version); the drop is a decorative bullet.
const logo = "/brand/nelma-logo.png";
const officialIcon = "/brand/nelma-drop.png";

// Where the "Get the app" buttons go. Until the Play Store listing is live, set VITE_ANDROID_DOWNLOAD_URL
// to the APK link from an EAS build. The App Store button only shows once an iPhone build exists.
const androidDownloadUrl =
  import.meta.env.VITE_ANDROID_DOWNLOAD_URL || "https://play.google.com/store/apps/details?id=com.nelma.drinkingwater";
const androidIsApk = /\.apk(\?|$)/i.test(androidDownloadUrl) || androidDownloadUrl.includes("expo.dev/artifacts");
const iosDownloadUrl = import.meta.env.VITE_IOS_DOWNLOAD_URL || "";
const heroBottle = heroBottleAsset.url;
const productImage = productImageAsset.url;

const gallery = [
  [plantRo.url, "Reverse osmosis unit", "Multi-stage RO membranes purify every litre before filling."],
  [plantTanks.url, "Pre-treatment tanks", "Sand and carbon filtration prepares the water for purification."],
  [plantLine.url, "Automated wash line", "Returned 20L bottles are washed and rinsed inside a stainless SUS304 line."],
  [plantFilling.url, "Filling station", "Clean bottles move straight from washing to filling with no manual handling."],
  [plantCapping.url, "Capping and sealing", "Each bottle is capped and sealed immediately after filling."],
  [plantStore.url, "Ready for collection", "Sealed 20-litre bottles stored on site, ready for pickup or delivery."],
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NELMA Drinking Water | Safe, Clean & Affordable" },
      { name: "description", content: "NELMA drinking water at NM-AIST, Arusha. 20L first purchase TZS 18,000, refill TZS 4,000. Order via the WISE-Futures Office or our mobile app." },
      { property: "og:title", content: "NELMA Drinking Water | Safe, Clean & Affordable" },
      { property: "og:description", content: "Safe, clean and affordable 20L drinking water at NM-AIST, Arusha. Get the NELMA app for quick refills." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Nelma,
});

const services = [
  [officialIcon, "Quality Check"], [officialIcon, "Filteration Level"], [officialIcon, "Composition"], [officialIcon, "Lab Control"],
] as const;
const features = [
  [officialIcon, "No Preservatives"], [officialIcon, "Added Micro Minerals"], [officialIcon, "Natural Quality"], [officialIcon, "Antioxidant"],
] as const;
const counters = [[officialIcon, "20L", "Reusable Bottles"], [officialIcon, "TZS 4,000", "Refill Price"], [officialIcon, "RO", "Purification"], [officialIcon, "NM-AIST", "Made on Campus"]] as const;
const orderSteps = [
  [Smartphone, "Place your order", "Choose a new 20-litre bottle or a refill, then enter the quantity you need."],
  [MapPin, "Set delivery details", "Share your campus location, preferred delivery time and any order remarks."],
  [Truck, "Follow delivery", "See your order status and the applicable delivery charge before fulfilment."],
  [PackageCheck, "Confirm receipt", "Mark the order as received and keep a clear record in your order history."],
] as const;
const appFeatures = [
  [CreditCard, "Simple payments", "Pay by the available cash or account option, with mobile till payments planned."],
  [Clock3, "Live order status", "Know whether your order is received, being prepared, out for delivery or completed."],
  [History, "Order history", "Review previous bottle purchases, refills, payments and delivery confirmations."],
  [MessageCircle, "Direct communication", "Add instructions or remarks and confirm “Received” after delivery."],
] as const;

function SectionTitle({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <div className={light ? "section-title section-title-light" : "section-title"}><h2>{children}</h2><img className="section-brand-icon" src={officialIcon} alt="" aria-hidden="true"/></div>;
}

function Nelma() {
  const [videoOpen, setVideoOpen] = useState(false);
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return <main>
    <section id="home" className="hero">
      <header className="header site-width">
        <a href="#home"><img src={logo} alt="NELMA Drinking Water"/></a>
        <button className="app-cta" onClick={() => scrollTo("app")}><Download size={17}/> Download App</button>
      </header>
      <div className="hero-content site-width">
        <div className="hero-copy">
          <p className="eyebrow">Water Is Nothing But Life</p>
          <h1>NELMA Drinking<br/>Water</h1>
          <p className="hero-text">Safe, clean and affordable drinking water for staff and students at NM-AIST (Nelson Mandela African Institution of Science and Technology), Arusha. Buy a 20-litre bottle at TZS 18,000 or refill for just TZS 4,000 at the WISE-Futures Office.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => scrollTo("plans")}>See Pricing</button>
            <button className="ghost-button" onClick={() => scrollTo("app")}><Smartphone size={17}/> Get The App</button>
          </div>
        </div>
        <img className="hero-bottle" src={heroBottle} alt="NELMA drinking water bottles"/>
      </div>
    </section>

    <section id="about" className="about section-space site-width">
      <div className="about-copy">
        <SectionTitle>Purified Here, For Our Community</SectionTitle>
        <p className="lead">NELMA produces purified drinking water in reusable, round-shaped 20-litre containers. Our on-campus unit manages the complete process—from washing and reverse osmosis purification to refilling, sealing and packaging.</p>
        <div className="services-grid">{services.map(([icon, title]) => <article key={title}><img src={icon} alt=""/><div><h3>{title}</h3><p>Each batch is checked before it reaches you.</p></div></article>)}</div>
      </div>
      <div className="about-visual"><img src={plantHall.url} alt="NELMA purification plant with rows of sealed 20 litre bottles"/><div className="experience"><strong>20L</strong><span>Standard<br/>Bottle</span></div></div>
    </section>

    <section id="story" className="quality section-space">
      <div className="site-width quality-inner">
        <div className="quality-copy"><SectionTitle light>We Deliver The Quality Water</SectionTitle><p>NELMA water is purified, mineral balanced and sealed in clean 20-litre bottles. Collect from the WISE-Futures Office, located near the cafeteria at NM-AIST in Arusha.</p><ul>{["Safe, clean and affordable drinking water.","First-time purchase includes a new 20-litre bottle.","Refill at TZS 4,000 when you return an empty bottle.","Order by phone on 0719 081 401 or in the app."].map(x => <li key={x}><Check size={17}/>{x}</li>)}</ul><button className="light-button" onClick={() => scrollTo("plans")}>See Pricing</button></div>
        <div className="quality-ring" aria-hidden="true"><div><span>100%</span><small>Pure Water</small></div></div>
      </div>
    </section>

    <section className="counter-band"><div className="site-width counter-grid">{counters.map(([icon, value, label]) => <div key={label}><img src={icon} alt=""/><strong>{value}</strong><span>{label}</span></div>)}</div></section>

    <section id="plant" className="gallery section-space site-width">
      <div className="gallery-heading"><SectionTitle>Inside The NELMA Plant</SectionTitle><p>Real photos from our on-campus purification and bottling facility at NM-AIST, Arusha.</p></div>
      <div className="gallery-grid">{gallery.map(([src, title, text]) => <figure key={title}><img src={src} alt={title} loading="lazy"/><figcaption><h3>{title}</h3><p>{text}</p></figcaption></figure>)}</div>
    </section>

    <section className="ordering section-space site-width">
      <div className="ordering-heading"><SectionTitle>From Order To Your Door</SectionTitle><p>NELMA makes access to drinking water easier for busy staff, students, households, offices and organisations around the NM-AIST community.</p></div>
      <div className="order-steps">{orderSteps.map(([Icon, title, text], index) => <article key={title}><span className="step-number">0{index + 1}</span><Icon aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>)}</div>
      <div className="service-strip"><span><Droplets/> Water refilling</span><span><Truck/> Water delivery</span><span><Recycle/> Reusable bottle sales</span><span><Building2/> Bulk supply</span><span><ShieldCheck/> Subscription plans</span></div>
    </section>

    <section id="features" className="features section-space site-width">
      <div className="features-heading"><SectionTitle>Why Choose NELMA</SectionTitle><p>Clean water you can trust, at a price that works for students and staff alike.</p></div>
      <div className="feature-layout"><div className="feature-column">{features.slice(0,2).map(([icon,title]) => <article key={title}><img src={icon} alt=""/><div><h3>{title}</h3><p>Purified, mineral balanced and sealed for freshness.</p></div></article>)}</div><img className="product-image" src={productImage} alt="NELMA 20 litre drinking water bottle"/><div className="feature-column">{features.slice(2).map(([icon,title]) => <article key={title}><img src={icon} alt=""/><div><h3>{title}</h3><p>Purified, mineral balanced and sealed for freshness.</p></div></article>)}</div></div>
    </section>

    <section className="video section-space"><div className="site-width video-inner"><button className="play" onClick={() => setVideoOpen(true)} aria-label="Play NELMA water video"><img src={officialIcon} alt=""/><Play size={26} fill="currentColor"/></button><div><SectionTitle light>See How We Work</SectionTitle><p>From filtration to filling, see how every NELMA bottle is prepared right here on campus.</p><button className="light-button" onClick={() => scrollTo("contact")}>Contact Us</button></div></div></section>

    <section id="plans" className="plans section-space site-width">
      <div className="plans-head"><SectionTitle>NELMA Pricing (20 Litres)</SectionTitle><p className="plans-note">Available at the WISE-Futures Office, near the cafeteria, NM-AIST, Arusha.</p></div>
      <div className="plan-grid plan-grid-two">
        <article>
          <h3>First-Time Purchase</h3>
          <div className="price"><sup>TZS</sup><strong>18,000</strong><span>/ 20L</span></div>
          <p>Includes drinking water and a new 20-litre bottle.</p>
          <ul>{["Brand new 20L bottle included","Filled with purified NELMA water","Collect at the WISE-Futures Office","Order by phone or in the app"].map(x=><li key={x}><Check size={15}/>{x}</li>)}</ul>
          <button onClick={() => scrollTo("contact")}>Order Now</button>
        </article>
        <article className="featured-plan">
          <h3>Refill Only</h3>
          <div className="price"><sup>TZS</sup><strong>4,000</strong><span>/ 20L</span></div>
          <p>Applicable upon return of an empty 20-litre bottle.</p>
          <ul>{["Return your empty 20L bottle","Same-day refill on campus","Best value for regular drinkers","Track refills in the app"].map(x=><li key={x}><Check size={15}/>{x}</li>)}</ul>
          <button onClick={() => scrollTo("contact")}>Refill Now</button>
        </article>
      </div>
    </section>

    <section id="app" className="app-section section-space">
      <div className="site-width app-inner">
        <div>
          <SectionTitle light>Get The NELMA App</SectionTitle>
          <p>Order water, book refills and track every delivery from your phone. The NELMA app is designed around the way our community actually buys water—without carrying a heavy 20-litre bottle across campus.</p>
          <div className="app-feature-list">{appFeatures.map(([Icon, title, text]) => <article key={title}><Icon aria-hidden="true"/><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
          <div className="store-buttons">
            {androidIsApk ? (
              <a href={androidDownloadUrl} download rel="noreferrer"><Download size={22}/><span><small>Download for</small>Android</span></a>
            ) : (
              <a href={androidDownloadUrl} target="_blank" rel="noreferrer"><Smartphone size={22}/><span><small>Get it on</small>Google Play</span></a>
            )}
            {iosDownloadUrl ? (
              <a href={iosDownloadUrl} target="_blank" rel="noreferrer"><Apple size={22}/><span><small>Download on the</small>App Store</span></a>
            ) : null}
          </div>
           <div className="app-contact-row"><a className="app-call" href="tel:+255719081401"><Phone size={16}/> Call 0719 081 401</a><a className="app-call" href="https://wa.me/255762307425" target="_blank" rel="noreferrer"><MessageCircle size={16}/> WhatsApp 0762 307 425</a></div>
        </div>
        <img src={productImage} alt="NELMA mobile app on a phone next to a water bottle"/>
      </div>
    </section>

    <section className="campus-band section-space"><div className="site-width campus-inner"><div><p className="eyebrow">Serving NM-AIST</p><h2>Clean water where your day happens</h2><p>We currently serve staff and students in hostels, PhD houses, the administration building and the cafeteria, with collection available from the WISE-Futures Office near the cafeteria.</p></div><div className="campus-contact"><a href="tel:+255719081401"><Phone/>0719 081 401</a><a href="mailto:nelma.water@nm-aist.ac.tz"><Mail/>nelma.water@nm-aist.ac.tz</a><p><MapPin/>NM-AIST, P.O. Box 447, Arusha, Tanzania</p></div></div></section>

    <footer id="contact"><div className="site-width footer-grid"><div><img src={logo} alt="NELMA"/><p>NELMA drinking water is safe, clean and affordable—produced for the NM-AIST community in Arusha.</p><div className="footer-social"><a href="tel:+255719081401" aria-label="Call NELMA"><Phone/></a><a href="https://wa.me/255762307425" target="_blank" rel="noreferrer" aria-label="WhatsApp NELMA"><MessageCircle/></a><a href="mailto:nelma.water@nm-aist.ac.tz" aria-label="Email NELMA"><Mail/></a></div></div><div><h3>Quick Links</h3><button onClick={()=>scrollTo("app")}>Mobile App</button><button onClick={()=>scrollTo("plans")}>Pricing</button><button onClick={()=>scrollTo("about")}>Our Process</button></div><div><h3>Contact Us</h3><a href="tel:+255719081401"><Phone/>0719 081 401</a><a href="mailto:nelma.water@nm-aist.ac.tz"><Mail/>nelma.water@nm-aist.ac.tz</a><p><MapPin/>WISE-Futures Office, near the cafeteria, NM-AIST, Arusha</p></div><div><h3>Order Options</h3><p>Visit the office, call, send an SMS or WhatsApp message, or use the NELMA mobile app.</p><button className="footer-order" onClick={()=>scrollTo("plans")}>View Water Pricing</button></div></div><div className="copyright">Copyright © 2026 NELMA Drinking Water. All rights reserved.</div></footer>

    {videoOpen && <div className="video-modal" role="dialog" aria-modal="true" aria-label="NELMA video"><button onClick={() => setVideoOpen(false)} aria-label="Close video"><X/></button><iframe src="https://www.youtube.com/embed/7e90gBu4pas?autoplay=1" title="NELMA water video" allow="autoplay; encrypted-media" allowFullScreen/></div>}
  </main>;
}
