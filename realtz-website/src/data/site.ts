export const site = {
  name: "Real Tanzania Discovery Adventures",
  shortName: "RealTZ Discovery",
  legalName: "Real Tanzania Discovery Adventures Limited",
  tagline: "Individual · Authentic · Competent",
  // Main contact (Reservations). Used for the header phone, WhatsApp button and form fallbacks.
  email: "info@realtzdiscovery.co.tz",
  phones: ["+255 758 239 283"],
  whatsapp: "255758239283",
  departments: [
    { name: "Reservations", note: "New trips, bookings and general questions", email: "info@realtzdiscovery.co.tz", phones: ["+255 758 239 283"] },
    { name: "Operations", note: "Guests already travelling and on-the-ground arrangements", email: "operations@realtzdiscovery.co.tz", phones: ["+255 782 212 008"] },
    { name: "Sales", note: "Travel agents, tour operators and quotations", email: "sales@realtzdiscovery.co.tz", phones: ["+255 627 619 124", "+255 682 997 428"] },
  ],
  address: "Boma Ng'ombe, Kilimanjaro, Tanzania",
  hours: [
    { days: "Monday to Friday", time: "8:00 AM to 6:00 PM" },
    { days: "Saturday", time: "9:00 AM to 2:00 PM" },
    { days: "Sunday", time: "By appointment" },
  ],
  // Add the real profile links here; empty ones are hidden.
  social: {
    instagram: "",
    facebook: "",
  },
  tripadvisor: {
    profile:
      "https://www.tripadvisor.com/Attraction_Review-g28116767-d29356232-Reviews-REAL_TANZANIA_DISCOVERY_ADVENTURES_LIMITED-Boma_Ng_ombe_Kilimanjaro_Region.html",
    review:
      "https://www.tripadvisor.com/UserReview-g28116767-d29356232-REAL_TANZANIA_DISCOVERY_ADVENTURES_LIMITED-Boma_Ng_ombe_Kilimanjaro_Region.html",
    rating: "5.0",
    count: 2,
  },
  sister: { name: "Real Africa", url: "https://real-africa.de/" },
};

export const telHref = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;

export const whatsappHref = (text = "Hello! I'd like to plan a trip to Tanzania.") =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;

export type NavItem = { label: string; to: string; children?: { label: string; to: string; note?: string }[] };

export const nav: NavItem[] = [
  { label: "Tanzania", to: "/tanzania" },
  {
    label: "Destinations",
    to: "/destinations",
    children: [
      { label: "National parks", to: "/destinations/national-parks", note: "Serengeti, Ngorongoro, Ruaha, Katavi…" },
      { label: "Mountains", to: "/destinations/mountains", note: "Kilimanjaro, Meru, Ol Doinyo Lengai…" },
      { label: "Islands & coast", to: "/destinations/islands", note: "Zanzibar, Pemba, Mafia, Kilwa…" },
    ],
  },
  {
    label: "Experiences",
    to: "/experiences",
    children: [
      { label: "Safari", to: "/safari", note: "22 national parks, privately guided" },
      { label: "Trekking", to: "/trekking", note: "Kilimanjaro, Meru, Usambara" },
      { label: "Culture", to: "/culture", note: "120+ peoples, real encounters" },
      { label: "Beach & Sea", to: "/beach-and-sea", note: "Zanzibar, Mafia, Kilwa" },
    ],
  },
  { label: "Journeys", to: "/journeys" },
  { label: "Community", to: "/community" },
  { label: "About Us", to: "/about-us" },
  { label: "Contact", to: "/contact" },
];
