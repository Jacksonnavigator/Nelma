import type { PhotoKey } from "./images";

export type Block =
  | { type: "p"; text: string }
  | { type: "lead"; text: string }
  | { type: "h2"; text: string }
  | { type: "photo"; photo: PhotoKey; caption?: string }
  | { type: "list"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "faq"; items: { q: string; a: string }[] };

export type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
  minutes: number;
  photo: PhotoKey;
  excerpt: string;
  body: Block[];
};

const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export const articles: Article[] = [
  {
    slug: "best-time-to-visit-tanzania-safari",
    title: "Best Time to Visit Tanzania for a Safari",
    category: "Travel tips",
    date: "April 2026",
    minutes: 6,
    photo: "zebrasRiver",
    excerpt: "Dry season, green season or calving season? A month-by-month guide to timing your safari right.",
    body: [
      { type: "lead", text: "Tanzania is one of Africa's most iconic safari destinations. But timing your visit right can mean the difference between witnessing the Great Migration and arriving to quiet, empty plains." },
      { type: "h2", text: "Month by month" },
      {
        type: "table",
        head: ["Month", "Rating", "Highlights"],
        rows: [
          ["January", stars(4), "Calving season begins, southern Serengeti"],
          ["February", stars(4), "Peak calving, predator action"],
          ["March", stars(2), "Long rains start, fewer visitors"],
          ["April", stars(1), "Heaviest rainfall, some lodges close"],
          ["May", stars(2), "Rains ease late month, lush scenery"],
          ["June", stars(5), "Dry season begins, excellent viewing"],
          ["July", stars(5), "Migration river crossings begin"],
          ["August", stars(5), "Peak migration, Mara River drama"],
          ["September", stars(5), "Dry season continues, clear skies"],
          ["October", stars(4), "Dry season ends, still great viewing"],
          ["November", stars(3), "Short rains, bird watching season"],
          ["December", stars(3), "Short rains end, green landscapes"],
        ],
      },
      { type: "h2", text: "The dry season: June to October" },
      { type: "p", text: "The dry season is widely considered the best time for a Tanzania safari. With minimal rainfall, animals gather around rivers and waterholes, making wildlife much easier to spot. The vegetation thins out, giving clearer views across the savannah." },
      { type: "p", text: "The Serengeti and Ngorongoro Crater are at their peak in these months. July to September is especially popular because it coincides with the Great Wildebeest Migration crossing the Mara River, one of nature's most dramatic spectacles." },
      { type: "photo", photo: "serengeti", caption: "The Serengeti in the dry season" },
      { type: "h2", text: "The green season: March to May" },
      { type: "p", text: "This period brings lush landscapes, fewer crowds and lower prices. The long rains run from March to May, with April usually the wettest month. Some remote lodges close, but many parks stay fully open, and bird watching is exceptional as migratory species arrive from Europe and Asia." },
      { type: "h2", text: "Calving season: January to February" },
      { type: "p", text: "In the southern Serengeti, hundreds of thousands of wildebeest give birth within a few weeks, drawing predators and creating some of the most action-packed scenes in the animal kingdom. A fantastic time for photographers, with warm and relatively dry weather between the two rains." },
      {
        type: "faq",
        items: [
          { q: "Is it safe to visit during the rainy season?", a: "Yes. The rains usually bring afternoon showers rather than all-day rain. Some remote roads get muddy, but most parks remain accessible, with fewer crowds and lower prices." },
          { q: "When is the best time to see the Great Migration?", a: "The migration moves around the Serengeti ecosystem all year. Mara River crossings typically happen July to September; calving in the south is January to February." },
          { q: "What should I pack?", a: "Light, neutral-coloured clothing, a warm layer for early game drives, comfortable shoes, a wide-brimmed hat, sunscreen, insect repellent, binoculars and a good camera. Add a light rain jacket in the green season." },
        ],
      },
    ],
  },
  {
    slug: "kilimanjaro-routes-compared",
    title: "Kilimanjaro Routes Compared: Which Is Right for You?",
    category: "Trekking",
    date: "April 2026",
    minutes: 7,
    photo: "kiliClouds",
    excerpt: "Lemosho, Machame, Marangu or Rongai? Duration, difficulty, success rates and scenery side by side.",
    body: [
      { type: "lead", text: "Climbing Kilimanjaro is a bucket-list adventure, but the right route can make the difference between standing on Uhuru Peak and turning back early. Here are the four most popular routes, compared." },
      {
        type: "table",
        head: ["Route", "Duration", "Difficulty", "Success", "Scenery", "Crowds"],
        rows: [
          ["Lemosho", "8 days", "Moderate", "90%+", "★★★★★", "Low"],
          ["Machame", "7 days", "Challenging", "85%", "★★★★★", "High"],
          ["Marangu", "5–6 days", "Moderate", "65%", "★★★", "Moderate"],
          ["Rongai", "6 days", "Moderate", "80%", "★★★★", "Very low"],
        ],
      },
      { type: "photo", photo: "kiliRidge", caption: "Above the clouds on the way to the summit" },
      { type: "h2", text: "Lemosho (8 days)" },
      { type: "p", text: "Widely regarded as the most scenic route. Starting from the west, it crosses the Shira Plateau before joining the southern circuit. Eight days of trekking give excellent acclimatisation and the highest summit success rate of any route. Best for: the best chance of reaching the top." },
      { type: "h2", text: "Machame (7 days)" },
      { type: "p", text: "The 'Whiskey Route' climbs steeply through rainforest, moorland and alpine desert. Its 'climb high, sleep low' profile helps acclimatisation, and the views from the Barranco Wall are unforgettable. Best for: adventure seekers." },
      { type: "h2", text: "Marangu (5–6 days)" },
      { type: "p", text: "The 'Coca-Cola Route' is the only one with huts instead of tents. The trail is gentler, but the short duration leaves less time to acclimatise, so the 'easiest' route has the lowest success rate. Allow six days, not five. Best for: hut comfort and tighter budgets." },
      { type: "h2", text: "Rongai (6 days)" },
      { type: "p", text: "Approaching from the north near the Kenyan border, Rongai is the driest route and a good choice in the rainy season. It sees far fewer trekkers, and the descent follows Marangu for variety. Best for: solitude and drier conditions." },
      {
        type: "faq",
        items: [
          { q: "What is the easiest route?", a: "Marangu is considered easiest, but it has the lowest success rate because of too few acclimatisation days." },
          { q: "How long does the climb take?", a: "Between 5 and 8 days depending on the route. We recommend 7 to 8 days for the best chance of success." },
          { q: "Which route is best for beginners?", a: "Lemosho (8 days) offers the best acclimatisation and highest success rate, which makes it ideal for first-timers." },
        ],
      },
    ],
  },
  {
    slug: "zanzibar-beach-holiday-guide",
    title: "Zanzibar & Beyond: Choosing Your Beach",
    category: "Beach & Sea",
    date: "April 2026",
    minutes: 5,
    photo: "zanzibarDhows",
    excerpt: "Zanzibar is only the beginning. How to pick between Zanzibar, Mafia Island, Kilwa, Pangani and Bagamoyo.",
    body: [
      { type: "lead", text: "After days of dust and game drives, nothing beats sea breeze and warm water. Tanzania's coast has far more to offer than one island; here is how to choose." },
      { type: "h2", text: "Zanzibar: culture and white sand" },
      { type: "p", text: "Famous for white beaches and turquoise water, but its real magic is its heritage: the carved doors and alleys of Stone Town, spice farms and the evening food market at Forodhani Gardens. The north and east coasts have the finest beaches; tides on the east coast are dramatic, so ask us which stretch suits you." },
      { type: "photo", photo: "stoneTown", caption: "Stone Town, a UNESCO World Heritage Site" },
      { type: "h2", text: "Mafia Island: privacy and marine life" },
      { type: "p", text: "Far from mass tourism, with quiet beaches and some of East Africa's richest reefs. Between roughly October and March, whale sharks visit the waters off Mafia. Ideal for snorkelling, diving and truly switching off." },
      { type: "h2", text: "Kilwa, Pangani and Bagamoyo: history and calm" },
      { type: "list", items: ["Kilwa: uncrowded beaches beside the ruins of a once-great Swahili trading port", "Pangani: long, palm-lined beaches and a slow coastal pace", "Bagamoyo: a historic port town with local art, an easy drive from Dar es Salaam"] },
      { type: "h2", text: "Things to do by the sea" },
      { type: "list", items: ["Sail on a traditional dhow at sunset", "Snorkel or dive the coral reefs", "Try kitesurfing or sea kayaking", "Take a spice tour on Zanzibar", "Taste your way through Forodhani Gardens"] },
    ],
  },
];

export const findArticle = (slug: string) => articles.find((a) => a.slug === slug);
