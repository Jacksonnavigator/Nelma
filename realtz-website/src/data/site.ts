export const site = {
  name: "Real Tanzania Discovery Adventures",
  shortName: "RealTZ Discovery",
  legalName: "Real Tanzania Discovery Adventures Limited",
  tagline: "Individual · Authentic · Competent",
  email: "info@realtzdiscovery.co.tz",
  phones: ["+255 679 535 158", "+255 782 212 008"],
  whatsapp: "255679535158",
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
  { label: "Journal", to: "/journal" },
  { label: "Contact", to: "/contact" },
];
