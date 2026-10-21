import type { PhotoKey } from "./images";

export type JourneyDay = {
  day: number;
  title: string;
  stay?: string;
  meals?: string;
  photo?: PhotoKey;
  text?: string;
};

export type Journey = {
  slug: string;
  title: string;
  kicker: string;
  days: number;
  style: "Safari" | "Culture" | "Honeymoon" | "Culture & Beach";
  photo: PhotoKey;
  summary: string;
  highlights: string[];
  arrival: string;
  departure: string;
  itinerary: JourneyDay[];
  included: string[];
};

const safariIncluded = [
  "All transfers in a comfortable 4×4 Land Cruiser",
  "Accommodation as specified",
  "All meals and soft drinks",
  "Mineral water",
  "Park entrance fees",
  "A bottle of wine to celebrate your adventure",
];

export const journeys: Journey[] = [
  {
    slug: "8-days-safari",
    title: "Tanzania's Wild Wonders",
    kicker: "8 days · Northern circuit",
    days: 8,
    style: "Safari",
    photo: "serengeti",
    summary:
      "A classic private safari: Tarangire's elephants and baobabs, four days deep in the Serengeti and a full day in the Ngorongoro Crater.",
    highlights: ["Tarangire", "Serengeti", "Ngorongoro Crater"],
    arrival: "Kilimanjaro International Airport",
    departure: "Kilimanjaro International Airport",
    included: safariIncluded,
    itinerary: [
      { day: 1, title: "Gateway to Adventure", stay: "Arusha Grand Melia Hotel", photo: "arusha", text: "Arrive at Kilimanjaro International Airport and transfer to Arusha. Overnight at the comfortable Arusha Grand Melia Hotel, where you'll be briefed on your upcoming safari adventure." },
      { day: 2, title: "Tarangire National Park", stay: "Lodge in Karatu", photo: "tarangire", text: "After breakfast, drive to Tarangire National Park, famous for its large elephant herds and iconic baobab trees. Enjoy a full day game drive, spotting diverse wildlife gathered around the life giving Tarangire River." },
      { day: 3, title: "Journey to the Serengeti", stay: "Serengeti Heritage Hotel", photo: "serengeti", text: "Depart early for Serengeti National Park, passing through the scenic Ngorongoro Conservation Area. Arrive in time for a late afternoon game drive, witnessing the golden light of sunset over the endless plains." },
      { day: 4, title: "Serengeti's Northern Reaches", stay: "Serengeti Heritage Hotel", photo: "serengeti", text: "Explore the northern Serengeti, known for dramatic river crossings during the Great Migration (seasonal). Track predators and witness the vast herds that roam these legendary plains." },
      { day: 5, title: "Into Central Serengeti", stay: "Serengeti Heritage Hotel", photo: "cheetah", text: "Journey through the heart of the Serengeti, stopping for game drives along the way. The central Seronera area offers some of the best year round wildlife viewing." },
      { day: 6, title: "Full Day Serengeti", stay: "Serengeti Heritage Hotel", photo: "lionsSunset", text: "A full day dedicated to exploring the Serengeti's diverse ecosystems. From the kopjes to the open plains, every turn reveals new wildlife encounters." },
      { day: 7, title: "Ngorongoro Crater", stay: "Flamingo Safari Lodge, Karatu", photo: "ngorongoro", text: "Drive to Ngorongoro Conservation Area and descend into the famous crater. This natural wonder hosts an incredible concentration of wildlife including the Big Five. After an unforgettable day, drive to Karatu." },
      { day: 8, title: "Farewell to Tanzania", photo: "departure", text: "After breakfast, transfer to Kilimanjaro International Airport for your departure flight. Depart with unforgettable memories of Tanzania's wild wonders." },
    ],
  },
  {
    slug: "9-days-safari",
    title: "Discover Tanzania's Wild Heart",
    kicker: "9 days · Safari & Hadzabe",
    days: 9,
    style: "Safari",
    photo: "tarangire",
    summary:
      "Elephants in Tarangire, Manyara's tree-climbing lions, three days of Serengeti and the crater, ending with the Hadzabe hunter-gatherers at Lake Eyasi.",
    highlights: ["Tarangire", "Lake Manyara", "Serengeti", "Ngorongoro", "Lake Eyasi"],
    arrival: "Kilimanjaro International Airport",
    departure: "Kilimanjaro International Airport",
    included: safariIncluded,
    itinerary: [
      { day: 1, title: "Welcome to Tanzania", stay: "Arusha Tulia Boutique Hotel", photo: "arusha", text: "Your Tanzanian odyssey begins as you land at Kilimanjaro International Airport. A warm welcome awaits before you're whisked away to the charming town of Arusha. Settle into the comfort of Arusha Tulia Boutique Hotel and rest up for the adventures ahead." },
      { day: 2, title: "Tarangire's Elephant Paradise", stay: "Flamingo Safari Lodge, Karatu", photo: "tarangire", text: "Rise with the African sun and journey to Tarangire National Park, a hidden gem renowned for its large elephant herds and iconic baobab trees. Spend a full day exploring this diverse ecosystem, watching wildlife gather around the Tarangire River." },
      { day: 3, title: "Lake Manyara's Arboreal Lions", stay: "Flamingo Safari Lodge, Karatu", photo: "manyara", text: "Set out for Lake Manyara National Park, a compact yet diverse reserve famous for its tree climbing lions and flamingo fringed lake. Marvel at landscapes from lush groundwater forests to acacia woodlands and the shimmering alkaline lake." },
      { day: 4, title: "Serengeti Spectacle (Day 1)", stay: "Serengeti Heritage Hotel", photo: "serengeti", text: "Embark on an epic journey to the world famous Serengeti National Park, passing through the stunning Ngorongoro highlands en route. Immerse yourself in the heart of the African wilderness." },
      { day: 5, title: "Serengeti Spectacle (Day 2)", stay: "Serengeti Heritage Hotel", photo: "cheetah", text: "A full day of game drives deep into the Serengeti. Witness the Great Wildebeest Migration (seasonal), track big cats on the prowl, and lose yourself in the vastness of the endless plains." },
      { day: 6, title: "Serengeti Spectacle (Day 3)", stay: "Serengeti Heritage Hotel", photo: "lionsSunset", text: "Continue exploring the Serengeti's diverse ecosystems. From the Seronera Valley to the kopjes, every turn reveals new wildlife encounters. Share tales of the day's adventures under starlit skies." },
      { day: 7, title: "Ngorongoro Crater's Natural Wonder", stay: "Flamingo Safari Lodge, Karatu", photo: "ngorongoro", text: "Descend into the UNESCO World Heritage Site of Ngorongoro Crater, often called the Eighth Wonder of the World. This natural amphitheater hosts an incredible concentration of wildlife." },
      { day: 8, title: "Lake Eyasi & the Hadzabe", stay: "Tulia Boutique Hotel, Arusha", photo: "culturalCooking", text: "Visit Lake Eyasi and the Hadzabe people. Learn about their ancient hunter gatherer lifestyle, take part in traditional activities, and gain insight into a way of life that has remained largely unchanged for thousands of years." },
      { day: 9, title: "Farewell to Tanzania", photo: "departure", text: "Enjoy a leisurely breakfast before your transfer to Kilimanjaro International Airport. Depart with a heart full of memories and the spirit of Africa forever etched in your soul." },
    ],
  },
  {
    slug: "10-days-safari",
    title: "From Serengeti's Savannas to Kilimanjaro's Foothills",
    kicker: "10 days · Safari & Maasai",
    days: 10,
    style: "Safari",
    photo: "natron",
    summary:
      "The crater and the Serengeti, then three days with the Maasai at otherworldly Lake Natron, and a final day of caves, waterfalls and coffee on Kilimanjaro's slopes.",
    highlights: ["Ngorongoro", "Serengeti", "Lake Natron", "Maasai immersion", "Kilimanjaro foothills"],
    arrival: "Kilimanjaro International Airport",
    departure: "Kilimanjaro International Airport",
    included: safariIncluded,
    itinerary: [
      { day: 1, title: "Gateway to Adventure", stay: "Flamingo Safari Lodge, Karatu", photo: "arusha", text: "Your safari begins as you touch down at Kilimanjaro International Airport. A warm welcome awaits before a scenic 2.5 hour drive to the charming town of Karatu." },
      { day: 2, title: "Ngorongoro & a Serengeti Sunset", stay: "Serengeti Heritage Hotel", photo: "ngorongoro", text: "Descend into the Ngorongoro Crater, a natural amphitheater teeming with wildlife. After a picnic lunch, journey on to the Serengeti in time for a sunset game drive." },
      { day: 3, title: "Serengeti Spectacle (Day 1)", stay: "Serengeti Heritage Hotel", photo: "serengeti", text: "Venture deep into the park's heart, witnessing the drama of predator and prey and marveling at vast herds of wildebeest and zebra." },
      { day: 4, title: "Serengeti Spectacle (Day 2)", stay: "Serengeti Heritage Hotel", photo: "zebrasRiver", text: "Another full day exploring the Serengeti's diverse landscapes. Share stories of the day's sightings under a canopy of stars." },
      { day: 5, title: "Lake Natron & Maasai Immersion (Day 1)", stay: "Maasai Giraffe Hotel", photo: "natron", text: "Bid farewell to the Serengeti and journey to the otherworldly landscapes of Lake Natron, keeping your eyes peeled for wildlife along the way." },
      { day: 6, title: "Lake Natron & Maasai Immersion (Day 2)", stay: "Maasai Giraffe Hotel", photo: "sameWomen", text: "A unique cultural immersion with the Maasai people. Learn their ancient traditions, take part in daily activities, and gain insight into a way of life that has endured for centuries." },
      { day: 7, title: "Lake Natron & Maasai Immersion (Day 3)", stay: "Maasai Giraffe Hotel", photo: "natron", text: "Explore the flamingo fringed shores of Lake Natron and the stunning landscape of this remote area." },
      { day: 8, title: "Return to Boma Ng'ombe", stay: "Tulia Boutique Hotel", photo: "arusha", text: "A scenic drive back to Boma Ng'ombe, our home town at the foot of Kilimanjaro." },
      { day: 9, title: "Kilimanjaro's Hidden Treasures", stay: "Tulia Boutique Hotel", photo: "kiliGate", text: "Explore the lush foothills of Mount Kilimanjaro: the Machame Caves, cascading waterfalls, and a banana and coffee tour through the region's farming heritage." },
      { day: 10, title: "Farewell to Tanzania", photo: "departure", text: "A final breakfast before your transfer to Kilimanjaro International Airport." },
    ],
  },
  {
    slug: "10-days-cultural",
    title: "Tanzania's Cultural Mosaic",
    kicker: "10 days · Cultural safari",
    days: 10,
    style: "Culture",
    photo: "culturalCooking",
    summary:
      "Game drives woven together with people: a Maasai village, the Hadzabe and Datoga at Lake Eyasi, the market town of Mto wa Mbu and a cooking class in Arusha.",
    highlights: ["Maasai village", "Hadzabe & Datoga", "Ngorongoro", "Serengeti", "Mto wa Mbu"],
    arrival: "Kilimanjaro International Airport",
    departure: "Kilimanjaro International Airport",
    included: [...safariIncluded.slice(0, 5), "Cultural visit fees and guides", safariIncluded[5]],
    itinerary: [
      { day: 1, title: "Arrival in Arusha", stay: "Arusha Coffee Lodge", photo: "arusha", text: "Land at Kilimanjaro International Airport and transfer to Arusha for a briefing on the adventure ahead." },
      { day: 2, title: "Tarangire & a Maasai Village", stay: "Sangaiwe Tented Lodge", photo: "tarangire", text: "Morning game drive in Tarangire, famous for its elephants and baobabs. In the afternoon, join the daily life of a nearby Maasai village." },
      { day: 3, title: "Lake Eyasi & the Hadzabe", stay: "Lake Eyasi Safari Lodge", photo: "culturalCooking", text: "Meet the Hadzabe, one of the last hunter gatherer peoples in Africa, and join them on a traditional hunt. In the afternoon, visit the Datoga blacksmiths." },
      { day: 4, title: "Ngorongoro Crater", stay: "Ngorongoro Farmhouse", photo: "ngorongoro", text: "A full day of game viewing on the floor of the Ngorongoro Crater, home to the Big Five." },
      { day: 5, title: "Journey to the Serengeti", stay: "Serengeti Heritage Hotel", photo: "serengeti", text: "Game drives along the way as the landscape opens into endless golden plains." },
      { day: 6, title: "Full Day Serengeti", stay: "Serengeti Heritage Hotel", photo: "cheetah", text: "Track the Big Five, witness the Great Migration (seasonal) and soak in Africa's most famous national park." },
      { day: 7, title: "Serengeti to Mto wa Mbu", photo: "culturalBuffet", text: "A morning game drive, then a cultural walking tour of vibrant Mto wa Mbu: the market, banana beer and the many peoples who live here." },
      { day: 8, title: "Lake Manyara & Farm Life", photo: "manyara", text: "Morning game drive at Lake Manyara, then local farms and traditional cooking methods in the afternoon." },
      { day: 9, title: "Arusha Cultural Tour", photo: "sameCooking", text: "Arusha's market, local artisans and a traditional cooking class: a chance to connect with everyday Tanzanian life." },
      { day: 10, title: "Farewell to Tanzania", photo: "departure", text: "Transfer to Kilimanjaro International Airport, taking home a deeper understanding of Tanzania's cultural mosaic." },
    ],
  },
  {
    slug: "12-days-honeymoon",
    title: "From Serengeti's Savannas to Zanzibar's Shores",
    kicker: "12 days · Honeymoon",
    days: 12,
    style: "Honeymoon",
    photo: "zanzibarBeach",
    summary:
      "A romantic semi-luxury journey for couples: six days of safari, then Stone Town and five days of white sand and turquoise water on Zanzibar.",
    highlights: ["Tarangire", "Lake Manyara", "Serengeti", "Ngorongoro", "Stone Town", "Zanzibar beaches"],
    arrival: "Kilimanjaro International Airport",
    departure: "Zanzibar International Airport",
    included: [
      "All transfers in a comfortable 4×4 vehicle",
      "Domestic flight from Arusha to Zanzibar",
      "Accommodation as specified (semi luxury)",
      "All meals and drinking water",
      "Park entrance fees",
      "Professional English speaking guide",
      "Stone Town guided tour",
      "Airport transfers on arrival and departure",
    ],
    itinerary: [
      { day: 1, title: "Karibu Arusha", stay: "Arusha Serena Hotel, Resort & Spa", photo: "arusha", text: "A warm greeting and a cheerful 'Karibu Tanzania!' at the airport, then time to relax and settle into the African rhythm." },
      { day: 2, title: "Tarangire's Elephant Paradise", stay: "Lake Burunge Baobab Lodge", photo: "tarangire", text: "Large elephant herds, buffalo, lions and rarer kudu and oryx among majestic baobabs, with colourful birdlife like the lilac breasted roller." },
      { day: 3, title: "Lake Manyara's Hidden Gem", stay: "Acacia Farm Lodge, Karatu", photo: "manyara", text: "Lush forests full of monkeys and birds below the Rift Valley escarpment, and the famous Manyara hippo pool." },
      { day: 4, title: "Into the Serengeti", stay: "Malaika Seronera Camp", photo: "serengeti", text: "Journey to the legendary Serengeti for an afternoon safari across the vast open plains, then dinner under the stars." },
      { day: 5, title: "Serengeti Full Day Safari", stay: "Malaika Seronera Camp", photo: "cheetah", text: "Cheetahs, leopards and lions, the Seronera River and the kopjes, and depending on the season, the migrating herds." },
      { day: 6, title: "Ngorongoro Crater Descent", stay: "Acacia Farm Lodge, Karatu", photo: "ngorongoro", text: "The highest density of animals in Africa, including the elusive black rhino, with lunch on the crater floor by the hippo pool." },
      { day: 7, title: "Flight to Zanzibar & Stone Town", stay: "Zanzibar Serena Hotel, Stone Town", photo: "stoneTown", text: "A short flight to Zanzibar and an evening to unwind with a special dinner by the sea." },
      { day: 8, title: "Stone Town Tour & Beach Transfer", stay: "Royal Zanzibar Beach Resort", photo: "stoneTown", text: "Markets, a 19th century cathedral and narrow alleys of carved doors and Indian balconies, then lunch on a rooftop before heading to the beach." },
      { day: 9, title: "Zanzibar Beach Relaxation", stay: "Royal Zanzibar Beach Resort", photo: "zanzibarBeach", text: "Lounge under swaying palms or dive into the warm Indian Ocean. Today is entirely yours." },
      { day: 10, title: "Oceanside Bliss", stay: "Royal Zanzibar Beach Resort", photo: "zanzibarDhows", text: "Another day of freedom: snorkelling, a dhow cruise or a spice tour, all arranged for you." },
      { day: 11, title: "Final Day in Paradise", stay: "Royal Zanzibar Beach Resort", photo: "zanzibarWomen", text: "A last swim in crystal clear water and a romantic sunset together." },
      { day: 12, title: "Farewell to Zanzibar", photo: "departure", text: "Transfer to Abeid Amani Karume International Airport for your flight home." },
    ],
  },
  {
    slug: "15-days-east-tanzania",
    title: "Eastern Tanzania: Culture, Lushoto & Zanzibar",
    kicker: "15 days · Off the beaten track",
    days: 15,
    style: "Culture & Beach",
    photo: "sameFarming",
    summary:
      "Homestays and village life in Same, three days hiking the Usambara Mountains, the forests of Lushoto, and five slow days on Zanzibar.",
    highlights: ["Homestay in Boma Ng'ombe", "Same women's groups", "Usambara Mountains", "Lushoto", "Zanzibar"],
    arrival: "Kilimanjaro Airport",
    departure: "Zanzibar Airport",
    included: ["Airport transfers on arrival and departure", "Private driver-guide throughout", "Accommodation as specified (2× double room)", "Meals as listed per day", "Drinking water", "Community visit fees"],
    itinerary: [
      { day: 1, title: "Boma Ng'ombe", stay: "Khaya Homestay", meals: "Lunch & Dinner", photo: "machame2" },
      { day: 2, title: "Same", stay: "Johnsons Villas", meals: "Breakfast, Lunch & Dinner", photo: "sameWomen" },
      { day: 3, title: "Same", stay: "Johnsons Villas", meals: "Breakfast, Lunch & Dinner", photo: "sameCooking" },
      { day: 4, title: "Same", stay: "Johnsons Villas", meals: "Breakfast, Lunch & Dinner", photo: "sameFarming" },
      { day: 5, title: "Usambara Mountains", stay: "Mambo View Point Eco Lodge", meals: "Breakfast, Lunch & Dinner" },
      { day: 6, title: "Usambara Mountains", stay: "Mambo View Point Eco Lodge", meals: "Breakfast, Lunch & Dinner" },
      { day: 7, title: "Usambara Mountains", stay: "Mambo View Point Eco Lodge", meals: "Breakfast, Lunch & Dinner" },
      { day: 8, title: "Lushoto", stay: "Swiss Farm Cottage", meals: "Breakfast, Lunch & Dinner" },
      { day: 9, title: "Shume Magamba Forest Reserve", stay: "Swiss Farm Cottage", meals: "Breakfast, Lunch & Dinner" },
      { day: 10, title: "Zanzibar Island", stay: "Olzadia Boutique Hotel", meals: "Breakfast & Lunch", photo: "zanzibarBeach" },
      { day: 11, title: "Zanzibar Island", stay: "Olzadia Boutique Hotel", meals: "Breakfast" },
      { day: 12, title: "Zanzibar Island", stay: "Olzadia Boutique Hotel", meals: "Breakfast" },
      { day: 13, title: "Zanzibar Island", stay: "Olzadia Boutique Hotel", meals: "Breakfast" },
      { day: 14, title: "Zanzibar Island", stay: "Olzadia Boutique Hotel", meals: "Breakfast" },
      { day: 15, title: "Zanzibar Airport", meals: "Breakfast", photo: "departure" },
    ],
  },
];

export const findJourney = (slug: string) => journeys.find((j) => j.slug === slug);
