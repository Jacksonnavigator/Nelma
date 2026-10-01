import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import {
  Apple,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Droplets,
  History,
  House,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessagesSquare,
  PackageCheck,
  Phone,
  Recycle,
  ShieldCheck,
  Smartphone,
  Truck,
  X,
} from "lucide-react";

// Everything lives on this one page: the menu scrolls to sections, it never opens other pages.
// Brand images live in public/ so the site works on any host, not only on Lovable.
const logo = "/brand/nelma-logo.png";
const officialIcon = "/brand/nelma-drop.png";
const heroBottle = "/media/nelma-branded-two-bottles.png";
const singleBottle = "/media/nelma-branded-single-bottle.png";
const processPhoto = "/media/our-process.jpg";
const plantPretreatment = "/media/DSC_0874.jpg";
const plantFilling = "/media/DSC_0885.jpg";
const deliveryProcess = "/media/delivery-process.jpg";

// Where the download buttons go. By default the Android app (APK) attached to the newest GitHub release,
// named nelma.apk: the APK is too big to live in the repository (GitHub's 100 MB file limit), and this link
// always follows the latest release. Once the app is on the Play Store, set VITE_ANDROID_DOWNLOAD_URL to the
// listing instead. The App Store button only shows once an iPhone build exists.
const androidDownloadUrl =
  import.meta.env.VITE_ANDROID_DOWNLOAD_URL ||
  "https://github.com/Jacksonnavigator/Nelma/releases/latest/download/nelma.apk";
const androidIsApk =
  /\.apk(\?|$)/i.test(androidDownloadUrl) || androidDownloadUrl.includes("expo.dev/artifacts");
const iosDownloadUrl = import.meta.env.VITE_IOS_DOWNLOAD_URL || "";

// The NELMA API receives the Contact Us and Order Now forms and supplies live prices and areas.
const apiUrl = (import.meta.env.VITE_API_URL || "https://nelma-gts5.onrender.com/api/v1").replace(
  /\/$/,
  "",
);

const contact = {
  phone: "0719 081 401",
  phoneHref: "tel:+255719081401",
  mobiles: ["+255 719 081 401", "+255 762 307 425"],
  whatsapp: "0762 307 425",
  whatsappHref: "https://wa.me/255762307425",
  email: "nelma.water@nm-aist.ac.tz",
  address: "WISE-Futures Office, near the cafeteria, NM-AIST, Tengeru, Arusha",
};

const mapEmbed =
  "https://www.google.com/maps?q=Nelson%20Mandela%20African%20Institution%20of%20Science%20and%20Technology%2C%20Tengeru%2C%20Arusha&z=14&output=embed";

const navLinks = [
  ["home", "Home"],
  ["our-water", "Our Water"],
  ["pricing", "Pricing"],
  ["contact", "Contact Us"],
] as const;

// The three photos the October recommendations keep ("hizi picha ndo zibaki"), with their captions.
const gallery = [
  [
    plantPretreatment,
    "Pretreatment Tanks",
    "Pretreatment tanks and control valves forming the initial stage of the water purification process, where incoming water is conditioned and prepared for further purification.",
  ],
  [
    processPhoto,
    "Water Purification System",
    "An integrated purification system where water undergoes successive purification stages, including RO membrane filtration, to achieve the required quality for drinking.",
  ],
  [
    plantFilling,
    "Water Filling Machine",
    "Automated equipment for washing, filling, and capping purified water into 20-litre reusable bottles, ensuring hygienic and efficient packaging.",
  ],
] as const;

const orderSteps = [
  [
    Smartphone,
    "Place your order",
    "Choose a new 20-litre bottle or a refill, then enter the quantity you need.",
  ],
  [
    MapPin,
    "Set delivery details",
    "Share your campus location, preferred delivery time and any order remarks.",
  ],
  [
    Truck,
    "Follow delivery",
    "See your order status and the applicable delivery charge before fulfilment.",
  ],
  [
    PackageCheck,
    "Confirm receipt",
    "Mark the order as received and keep a clear record in your order history.",
  ],
] as const;

const appFeatures = [
  [
    CreditCard,
    "Simple payments",
    "Pay by the available cash or account option, with mobile till payments planned.",
  ],
  [
    Clock3,
    "Live order status",
    "Know whether your order is received, being prepared, out for delivery or completed.",
  ],
  [
    History,
    "Order history",
    "Review previous bottle purchases, refills, payments and delivery confirmations.",
  ],
  [
    MessageCircle,
    "Direct communication",
    "Add instructions or remarks and confirm “Received” after delivery.",
  ],
] as const;

type Product = {
  code: string;
  name: string;
  unitPrice: number;
  description?: string | null;
  sortOrder?: number;
};

// Shown until the live prices load, and if the server cannot be reached.
const fallbackProducts: Product[] = [
  { code: "first_purchase", name: "First-Time Purchase", unitPrice: 18000, sortOrder: 0 },
  { code: "refill", name: "Refill Only", unitPrice: 4000, sortOrder: 1 },
];

const priceCopy: Record<string, { title: string; note: string; action: string }> = {
  first_purchase: {
    title: "First-Time Purchase",
    note: "Includes drinking water and a new 20-litre bottle.",
    action: "Order Now",
  },
  refill: {
    title: "Refill Only",
    note: "Applicable upon return of an empty 20-litre bottle.",
    action: "Refill Now",
  },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NELMA Drinking Water | Maji Safi na Salama" },
      {
        name: "description",
        content:
          "Clean, safe and refreshing 20-litre drinking water for homes, businesses and offices in Arusha. Produced at WISE Futures, NM-AIST, Tengeru. Order online or with the NELMA app.",
      },
      { property: "og:title", content: "NELMA Drinking Water | Maji Safi na Salama" },
      {
        property: "og:description",
        content:
          "Clean, safe and refreshing 20-litre drinking water for homes, businesses and offices in Arusha.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Nelma,
});

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
const formatTzs = (amount: number) => new Intl.NumberFormat("en-US").format(amount);

function SectionTitle({
  children,
  light = false,
  center = false,
}: {
  children: ReactNode;
  light?: boolean;
  center?: boolean;
}) {
  return (
    <div
      className={[
        "section-title",
        light ? "section-title-light" : "",
        center ? "section-title-center" : "",
      ].join(" ")}
    >
      <h2>{children}</h2>
      <img className="section-brand-icon" src={officialIcon} alt="" aria-hidden="true" />
    </div>
  );
}

function DownloadLink({ className, children }: { className?: string; children: ReactNode }) {
  return androidIsApk ? (
    <a className={className} href={androidDownloadUrl} download="NELMA.apk">
      {children}
    </a>
  ) : (
    <a className={className} href={androidDownloadUrl} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function useCatalog() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [areas, setAreas] = useState<string[]>(["NM-AIST campus", "Tengeru", "Arusha"]);
  useEffect(() => {
    let cancelled = false;
    fetch(`${apiUrl}/settings/public`)
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (
          settings: {
            products?: Record<string, Omit<Product, "code">>;
            delivery?: { zones: { name: string }[]; defaultZoneName: string };
          } | null,
        ) => {
          if (cancelled || !settings?.products) return;
          const list = Object.entries(settings.products)
            .map(([code, product]) => ({ ...product, code }))
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          if (list.length) setProducts(list);
          if (settings.delivery)
            setAreas([
              ...settings.delivery.zones.map((zone) => zone.name),
              settings.delivery.defaultZoneName,
            ]);
        },
      )
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return { products, areas };
}

async function postForm(path: string, body: Record<string, unknown>): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `We could not reach NELMA right now. Please try again in a minute, or call ${contact.phone}.`,
    );
  }
  if (response.ok) return;
  const payload = (await response.json().catch(() => null)) as {
    detail?: { message?: string } | { msg?: string }[];
  } | null;
  const detail = payload?.detail;
  if (response.status === 429)
    throw new Error(
      `You have sent several requests already. Please call ${contact.phone} instead.`,
    );
  if (detail && !Array.isArray(detail) && detail.message) throw new Error(detail.message);
  if (Array.isArray(detail)) throw new Error("Please check the details you entered and try again.");
  throw new Error(`Something went wrong. Please try again, or call ${contact.phone}.`);
}

function Nelma() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState("");
  const { products, areas } = useCatalog();
  const go = (id: string) => {
    setMenuOpen(false);
    scrollTo(id);
  };
  const orderNow = (code: string) => {
    setOrderProduct(code);
    go("order");
  };

  return (
    <main>
      <section id="home" className="hero">
        <header className="header site-width">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              go("home");
            }}
          >
            <img src={logo} alt="NELMA Drinking Water" />
          </a>
          <nav className={menuOpen ? "main-nav open" : "main-nav"} aria-label="Main">
            {navLinks.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(id);
                }}
              >
                {label}
              </a>
            ))}
            <a
              className="nav-order"
              href="#order"
              onClick={(e) => {
                e.preventDefault();
                go("order");
              }}
            >
              Order Now
            </a>
          </nav>
          <DownloadLink className="app-cta">
            <Download size={17} /> Download App
          </DownloadLink>
          <button
            className="menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </header>
        <div className="hero-content site-width">
          <h1 className="visually-hidden">NELMA Drinking Water — Maji Safi na Salama</h1>
          <img
            className="hero-bottle hero-bottle-centered"
            src={heroBottle}
            alt="NELMA 20-litre drinking water bottles"
          />
        </div>
      </section>

      <section id="about" className="about-us section-space site-width">
        <div>
          <SectionTitle>About Us</SectionTitle>
          <p className="lead">
            <strong>Nelma Drinking Water</strong> provides clean, safe, and refreshing 20 litre
            water gallons for homes, business and offices. Produced in our factory in Tengeru at
            WISE Futures in Nelson Mandela African Institute of Science and Technology, every gallon
            is crafted to meet the highest standards of quality and safety, ensuring reliable
            hydration for daily use.
          </p>
          <p>
            From the very first sip, customers notice water that is fresh, naturally refreshing and
            of consistent quality. Our team is committed to maintaining strict quality control,
            making sure that every gallon delivered is safe, wholesome and ready for consumption. We
            understand how essential clean water is for health, productivity and overall wellbeing,
            we strive to provide a product that families and businesses can fully trust.
          </p>
          <p>
            Nelma Water currently serves the Arusha region, providing households and offices with a
            dependable source of hydration. True to our motto,{" "}
            <strong>“Maji Safi na Salama,”</strong> every stage of our production and handling
            process is carefully monitored, ensuring that our water meets rigorous safety standards.
          </p>
          <p>
            Our mission is to deliver more than just water, we aim to support healthy lifestyles and
            daily wellbeing by making clean, refreshing water easily accessible. By focusing on
            quality, safety, and customer satisfaction, Nelma Water continues to be a trusted choice
            for those who value pure, reliable hydration every day.
          </p>
        </div>
      </section>

      <section id="our-water" className="our-water section-space">
        <div className="site-width">
          <div className="story-row">
            <div>
              <SectionTitle>Our Water</SectionTitle>
              <p>
                Nelma drinking Water is produced through a modern, science-driven purification
                process designed to deliver safe, clean and consistently high quality drinking
                water. Every stage of our production follows strict hygiene protocols, advanced
                filtration methods, and continuous monitoring, ensuring the water that reaches our
                customers meets the highest safety standards.
              </p>
              <p>
                We source our water and refine it using a carefully structured multi-stage
                purification system that effectively removes impurities while maintaining a smooth
                and refreshing drinking experience. Each part of the process is precisely managed to
                uphold quality, stability and consistency in every batch.
              </p>
              <p>
                Our commitment to excellence, innovation, and reliability drives us to continually
                improve our systems in line with evolving consumer needs and regulatory
                requirements. This dedication to quality is what defines Nelma Water clean, safe,
                and trusted by the communities we proudly serve.
              </p>
            </div>
            <img
              className="story-bottle"
              src={singleBottle}
              alt="NELMA 20-litre bottle"
              loading="lazy"
            />
          </div>

          <div className="story-row story-row-reverse">
            <div>
              <SectionTitle>Our Process</SectionTitle>
              <p>
                Nelma Drinking Water is produced through a 10-stage purification process to ensure
                clean, safe, and refreshing drinking water. The process begins with carefully
                selected source water, followed by sediment, sand, activated carbon, and micron
                filtration to remove particles, impurities, unwanted tastes, and odors.
              </p>
              <p>
                The water then passes through Reverse Osmosis (RO) membranes, which remove dissolved
                salts, contaminants, and microorganisms at a very fine level. It is then treated
                with UV sterilization and ozone disinfection to provide additional protection and
                maintain freshness.
              </p>
              <p>
                Throughout the process, water quality is regularly monitored and tested to ensure
                safety and consistency. Finally, the purified water is hygienically bottled and
                sealed to preserve its quality until it reaches your home or office.
              </p>
            </div>
            <img
              className="story-photo"
              src={processPhoto}
              alt="Reverse osmosis purification unit at the NELMA plant"
              loading="lazy"
            />
          </div>

          <div className="gallery-heading">
            <SectionTitle center>Inside The NELMA Plant</SectionTitle>
            <p>
              Real photos from our on-campus purification and bottling facility at NM-AIST, Arusha.
            </p>
          </div>
          <div className="gallery-grid">
            {gallery.map(([src, title, text]) => (
              <figure key={title}>
                <img src={src} alt={title} loading="lazy" />
                <figcaption>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="story-row delivery-row">
            <div>
              <SectionTitle>Delivery</SectionTitle>
              <p>
                We know life is busy, and convenience matters. A 20-litre bottle of water is heavy,
                but our specialized delivery team takes care of the lifting for you! When you buy 20
                bottles or more, delivery is done across all our service areas, whether you are a
                large office, a small shop or a home.
              </p>
              <p>
                Our deliveries run on scheduled routes, ensuring you receive your water on a
                reliable, regular basis. If you ever run out unexpectedly, we can accommodate
                same-day or urgent delivery to keep you stocked. Ordering is easy you can reach us
                via phone, WhatsApp, email, or our website at any time.
              </p>
              <button className="primary-button" onClick={() => go("order")}>
                Order Now
              </button>
            </div>
            <img
              className="story-diagram"
              src={deliveryProcess}
              alt="How delivery works: you place an order by WhatsApp, phone or email, our customer care team processes it, our delivery team delivers it and you get an electronic delivery note"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="ordering section-space site-width">
        <div className="ordering-heading">
          <SectionTitle center>From Order To Your Door</SectionTitle>
          <p>
            NELMA makes access to drinking water easier for busy staff, students, households,
            offices and organisations around the NM-AIST community.
          </p>
        </div>
        <div className="order-steps">
          {orderSteps.map(([Icon, title, text], index) => (
            <article key={title}>
              <span className="step-number">0{index + 1}</span>
              <Icon aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <div className="service-strip">
          <span>
            <Droplets /> Water refilling
          </span>
          <span>
            <Truck /> Water delivery
          </span>
          <span>
            <Recycle /> Reusable bottle sales
          </span>
          <span>
            <Building2 /> Bulk supply
          </span>
          <span>
            <ShieldCheck /> Subscription plans
          </span>
        </div>
      </section>

      {/* Slide 16 "REMOVE/REMAIN": the video play button is removed, the text and Contact Us button remain. */}
      <section className="video section-space">
        <div className="site-width video-inner video-inner-text">
          <div>
            <SectionTitle light center>
              See How We Work
            </SectionTitle>
            <p>
              From filtration to filling, see how every NELMA bottle is prepared right here on
              campus.
            </p>
            <button className="light-button" onClick={() => go("contact")}>
              Contact Us
            </button>
          </div>
        </div>
      </section>

      <section id="pricing" className="plans section-space site-width">
        <div className="plans-head">
          <SectionTitle center>NELMA Pricing (20 Litres)</SectionTitle>
          <p className="plans-note">
            Available at the WISE-Futures Office, near the cafeteria, NM-AIST, Arusha.
          </p>
        </div>
        <div className={products.length > 2 ? "plan-grid" : "plan-grid plan-grid-two"}>
          {products.map((product, index) => {
            const copy = priceCopy[product.code];
            return (
              <article key={product.code} className={index === 1 ? "featured-plan" : undefined}>
                <h3>{copy?.title ?? product.name}</h3>
                <div className="price">
                  <sup>TZS</sup>
                  <strong>{formatTzs(product.unitPrice)}</strong>
                  <span>/ 20L</span>
                </div>
                <p>{copy?.note ?? product.description ?? ""}</p>
                <button onClick={() => orderNow(product.code)}>
                  {copy?.action ?? "Order Now"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section id="app" className="app-section section-space">
        <div className="site-width app-inner">
          <div>
            <SectionTitle light>Get The NELMA App</SectionTitle>
            <p>
              Order water, book refills and track every delivery from your phone. The NELMA app is
              designed around the way our community actually buys water—without carrying a heavy
              20-litre bottle across campus.
            </p>
            <div className="app-feature-list">
              {appFeatures.map(([Icon, title, text]) => (
                <article key={title}>
                  <Icon aria-hidden="true" />
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="store-buttons">
              {androidIsApk ? (
                <DownloadLink>
                  <Download size={22} />
                  <span>
                    <small>Download for</small>Android
                  </span>
                </DownloadLink>
              ) : (
                <DownloadLink>
                  <Smartphone size={22} />
                  <span>
                    <small>Get it on</small>Google Play
                  </span>
                </DownloadLink>
              )}
              {iosDownloadUrl ? (
                <a href={iosDownloadUrl} target="_blank" rel="noreferrer">
                  <Apple size={22} />
                  <span>
                    <small>Download on the</small>App Store
                  </span>
                </a>
              ) : null}
            </div>
            {androidIsApk ? (
              <p className="install-hint">
                After downloading, open the file. If Android asks, allow installing apps from your
                browser, then tap Install.
              </p>
            ) : null}
            <div className="app-contact-row">
              <a className="app-call" href={contact.phoneHref}>
                <Phone size={16} /> Call {contact.phone}
              </a>
              <a className="app-call" href={contact.whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle size={16} /> WhatsApp {contact.whatsapp}
              </a>
            </div>
          </div>
          <img src={singleBottle} alt="NELMA 20-litre water bottle" />
        </div>
      </section>

      <ContactSection />

      <OrderSection
        products={products}
        areas={areas}
        product={orderProduct}
        onProductChange={setOrderProduct}
      />

      <section className="campus-band section-space">
        <div className="site-width campus-inner">
          <div>
            <p className="eyebrow">Serving NM-AIST</p>
            <h2>Clean water where your day happens</h2>
            <p>
              We currently serve staff and students in hostels, PhD houses, the administration
              building and the cafeteria, with collection available from the WISE-Futures Office
              near the cafeteria.
            </p>
          </div>
          <div className="campus-contact">
            <a href={contact.phoneHref}>
              <Phone />
              {contact.phone}
            </a>
            <a href={`mailto:${contact.email}`}>
              <Mail />
              {contact.email}
            </a>
            <p>
              <MapPin />
              NM-AIST, P.O. Box 447, Arusha, Tanzania
            </p>
          </div>
        </div>
      </section>

      <footer>
        <div className="site-width footer-grid">
          <div>
            <img src={logo} alt="NELMA" />
            <p>
              NELMA drinking water is safe, clean and affordable—produced for the NM-AIST community
              in Arusha.
            </p>
            <div className="footer-social">
              <a href={contact.phoneHref} aria-label="Call NELMA">
                <Phone />
              </a>
              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp NELMA"
              >
                <MessageCircle />
              </a>
              <a href={`mailto:${contact.email}`} aria-label="Email NELMA">
                <Mail />
              </a>
            </div>
          </div>
          <div>
            <h3>Quick Links</h3>
            <button onClick={() => go("app")}>Mobile App</button>
            <button onClick={() => go("pricing")}>Pricing</button>
            <button onClick={() => go("our-water")}>Our Process</button>
          </div>
          <div>
            <h3>Contact Us</h3>
            <a href={contact.phoneHref}>
              <Phone />
              {contact.phone}
            </a>
            <a href={`mailto:${contact.email}`}>
              <Mail />
              {contact.email}
            </a>
            <p>
              <MapPin />
              WISE-Futures Office, near the cafeteria, NM-AIST, Arusha
            </p>
          </div>
          <div>
            <h3>Order Options</h3>
            <p>
              Visit the office, call, send an SMS or WhatsApp message, or use the NELMA mobile app.
            </p>
            <button className="footer-order" onClick={() => go("pricing")}>
              View Water Pricing
            </button>
          </div>
        </div>
        <div className="copyright">Copyright © 2026 NELMA Drinking Water. All rights reserved.</div>
      </footer>
    </main>
  );
}

function FormStatus({
  sent,
  error,
  sentText,
}: {
  sent: boolean;
  error: string | null;
  sentText: string;
}) {
  if (sent)
    return (
      <p className="form-status form-status-ok" role="status">
        <CheckCircle2 size={18} /> {sentText}
      </p>
    );
  if (error)
    return (
      <p className="form-status form-status-error" role="alert">
        {error}
      </p>
    );
  return null;
}

function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string) => {
    setSent(false);
    setForm((current) => ({ ...current, [key]: value }));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await postForm("/website/contact", form);
      setSent(true);
      setForm({ name: "", email: "", message: "", website: "" });
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="page-banner">
        <h2>Contact Us</h2>
        <p>
          You are here:{" "}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("home");
            }}
          >
            Home
          </a>{" "}
          » Contact Us
        </p>
      </div>
      <div className="site-width section-space contact-body">
        <div className="contact-intro">
          <MessagesSquare aria-hidden="true" />
          <h2>
            <span className="contact-watermark" aria-hidden="true">
              Contact Us
            </span>
            Get In Touch
          </h2>
          <p>
            It's more than water,
            <br />
            it's your lifestyle.
          </p>
        </div>
        <div className="contact-grid">
          <iframe
            className="contact-map"
            src={mapEmbed}
            title="Map: WISE Futures, NM-AIST, Tengeru, Arusha"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div>
            <div className="contact-details">
              <div>
                <House />
                <div>
                  <h3>Phone</h3>
                  <a href={contact.phoneHref}>{contact.phone}</a>
                  <p>{contact.address}</p>
                </div>
              </div>
              <div>
                <Smartphone />
                <div>
                  <h3>Mobile/Fax</h3>
                  {contact.mobiles.map((number) => (
                    <a key={number} href={`tel:${number.replace(/\s/g, "")}`}>
                      {number}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <Mail />
                <div>
                  <h3>Email</h3>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </div>
              </div>
            </div>
            <form className="site-form" onSubmit={submit}>
              <input
                className="honeypot"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={form.website}
                onChange={(e) => set("website")(e.target.value)}
                name="website"
              />
              <div className="form-row">
                <label>
                  Your Name *
                  <input
                    required
                    minLength={2}
                    maxLength={160}
                    value={form.name}
                    onChange={(e) => set("name")(e.target.value)}
                    autoComplete="name"
                  />
                </label>
                <label>
                  Your Email *
                  <input
                    required
                    type="email"
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => set("email")(e.target.value)}
                    autoComplete="email"
                  />
                </label>
              </div>
              <label>
                Your Message *
                <textarea
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={5}
                  value={form.message}
                  onChange={(e) => set("message")(e.target.value)}
                />
              </label>
              <FormStatus
                sent={sent}
                error={error}
                sentText="Thank you! Your message has reached NELMA. We will get back to you soon."
              />
              <button className="primary-button" type="submit" disabled={sending}>
                {sending ? "Sending…" : "Send Your Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

const emptyOrder = {
  customerType: "",
  name: "",
  company: "",
  email: "",
  phone: "",
  city: "Arusha",
  area: "",
  quantity: "2",
  address: "",
  instructions: "",
  website: "",
};

function OrderSection({
  products,
  areas,
  product,
  onProductChange,
}: {
  products: Product[];
  areas: string[];
  product: string;
  onProductChange: (code: string) => void;
}) {
  const [form, setForm] = useState(emptyOrder);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string) => {
    setSent(false);
    setForm((current) => ({ ...current, [key]: value }));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.customerType) {
      setError("Tell us whether you are a new or an existing customer.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await postForm("/website/orders", {
        ...form,
        productCode: product,
        quantity: Number(form.quantity),
      });
      setSent(true);
      setForm(emptyOrder);
      onProductChange("");
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="order" className="order-section section-space">
      <div className="site-width">
        <div className="ordering-heading">
          <SectionTitle center>Order Now</SectionTitle>
          <p>
            Send us your order and our customer care team will call you to confirm the price,
            delivery time and payment.
          </p>
        </div>
        <form className="site-form order-form" onSubmit={submit}>
          <input
            className="honeypot"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={form.website}
            onChange={(e) => set("website")(e.target.value)}
            name="website"
          />
          <fieldset className="customer-type">
            <legend>Customer</legend>
            <label>
              <input
                type="radio"
                name="customerType"
                value="new"
                checked={form.customerType === "new"}
                onChange={() => set("customerType")("new")}
              />{" "}
              New Customer
            </label>
            <label>
              <input
                type="radio"
                name="customerType"
                value="existing"
                checked={form.customerType === "existing"}
                onChange={() => set("customerType")("existing")}
              />{" "}
              Existing Customer
            </label>
          </fieldset>
          <div className="form-row">
            <label>
              Name *
              <input
                required
                minLength={2}
                maxLength={160}
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label>
              Company *
              <input
                required
                minLength={2}
                maxLength={160}
                value={form.company}
                onChange={(e) => set("company")(e.target.value)}
                autoComplete="organization"
                placeholder="Company name, or Home"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Email *
              <input
                required
                type="email"
                maxLength={255}
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label>
              Mobile *
              <input
                required
                type="tel"
                minLength={9}
                maxLength={32}
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value)}
                autoComplete="tel"
                placeholder="07XX XXX XXX"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              City
              <select value={form.city} onChange={(e) => set("city")(e.target.value)}>
                <option value="Arusha">Arusha</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              Area *
              <select required value={form.area} onChange={(e) => set("area")(e.target.value)}>
                <option value="" disabled>
                  Please Select
                </option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Product *
              <select required value={product} onChange={(e) => onProductChange(e.target.value)}>
                <option value="" disabled>
                  Please Select
                </option>
                {products.map((item) => (
                  <option key={item.code} value={item.code}>
                    {(priceCopy[item.code]?.title ?? item.name) +
                      " — TZS " +
                      formatTzs(item.unitPrice)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Add Quantity *
              <input
                required
                type="number"
                min={1}
                max={500}
                value={form.quantity}
                onChange={(e) => set("quantity")(e.target.value)}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Address
              <textarea
                rows={4}
                maxLength={1000}
                value={form.address}
                onChange={(e) => set("address")(e.target.value)}
                placeholder="Street, building, house or room"
              />
            </label>
            <label>
              Special Instruction
              <textarea
                rows={4}
                maxLength={1000}
                value={form.instructions}
                onChange={(e) => set("instructions")(e.target.value)}
                placeholder="Delivery time, landmark, gate code…"
              />
            </label>
          </div>
          <FormStatus
            sent={sent}
            error={error}
            sentText="Thank you! Your order request has reached NELMA. Our team will call you shortly to confirm it."
          />
          <button className="submit-button" type="submit" disabled={sending}>
            {sending ? "Sending…" : "Submit"}
          </button>
        </form>
      </div>
    </section>
  );
}
