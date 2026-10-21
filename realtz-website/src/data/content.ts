import type { PhotoKey } from "./images";

export type Experience = {
  slug: string;
  to: string;
  title: string;
  line: string;
  photo: PhotoKey;
};

export const experiences: Experience[] = [
  { slug: "safari", to: "/safari", title: "Safari", line: "Twenty-two national parks, each with its own character. We find the ones that will captivate you.", photo: "elephantZebras" },
  { slug: "trekking", to: "/trekking", title: "Trekking", line: "The Roof of Africa awaits: Kilimanjaro, Mount Meru, Ol Doinyo Lengai, or gentle village walks.", photo: "kiliSummit" },
  { slug: "culture", to: "/culture", title: "Culture", line: "More than 120 peoples living peacefully together. Cook, farm and laugh with them.", photo: "culturalBuffet" },
  { slug: "beach", to: "/beach-and-sea", title: "Beach & Sea", line: "White coral sand, turquoise water and the spice islands. The perfect ending.", photo: "zanzibarWomen" },
];

export const values = [
  { title: "Individual", text: "We plan your trip exactly the way you envision it, exclusively for you and your companions. No catalogues, no fixed dates, no shared groups." },
  { title: "Authentic", text: "Deep insights into real life in Tanzania, especially off the beaten tourist trails. Real Africa, indeed." },
  { title: "Competent", text: "From the first message to the farewell smile, you are looked after by Tanzanians who grew up here and in the travel industry." },
];

export const stats = [
  { value: "22", label: "National parks" },
  { value: "120+", label: "Peoples & cultures" },
  { value: "5,895 m", label: "Kilimanjaro summit" },
  { value: "100%", label: "Private journeys" },
];

export const steps = [
  { n: "01", title: "Tell us your dream", text: "Share what moves you: wildlife, mountains, people, the sea. Two minutes with our trip planner or a message on WhatsApp is enough." },
  { n: "02", title: "We craft your route", text: "Beatrice and Nathan design an itinerary around your pace, budget and interests, then refine it with you by phone, video call or email." },
  { n: "03", title: "Travel, cared for", text: "Your own driver-guide, our team on call on the ground, and every detail handled. All that's left for you is to be amazed." },
];

export type Partner = {
  name: string;
  place: string;
  photos: PhotoKey[];
  intro: string;
  sections: { title: string; text?: string; list?: string[] }[];
};

export const partners: Partner[] = [
  {
    name: "Mama na Mwana Foundation",
    place: "Vikindu, Mkuranga · near Dar es Salaam",
    photos: ["vikindu1", "vikindu2", "vikindu3", "vikindu4"],
    intro:
      "A dedicated organisation supporting children with disabilities and empowering their mothers. Guests can stay at the welcoming Vikindu Homestay, just outside Dar es Salaam: more than accommodation, a meaningful cultural exchange.",
    sections: [
      { title: "The foundation works to", list: ["Support children with disabilities through care and advocacy", "Empower mothers with skills and income-generating opportunities", "Improve access to education, healthcare and social support"] },
      { title: "During your stay you can", list: ["Share daily life with local families", "Take part in community activities", "Understand the challenges and strengths of families raising children with disabilities"] },
    ],
  },
  {
    name: "Same Women's Groups",
    place: "Majevu & Mhama · near Mkomazi National Park",
    photos: ["sameCooking", "sameWomen", "sameFarming"],
    intro:
      "Two groups of ten women each: the Majevu group near the Kijiji Kizuri Cultural Center, and the Mhama group near Msharabwe Hill. Both are part of our newly developed cultural and accommodation project.",
    sections: [
      { title: "What the women do", list: ["Livestock keeping (cattle and poultry)", "Crop farming", "Pottery and handicrafts", "Batik making", "Beekeeping and honey production"] },
      { text: "Proceeds from guest participation and handmade products go directly to the women, sustaining their livelihoods and independence.", title: "Where your money goes" },
    ],
  },
  {
    name: "Machame Nkweshoo Women's Group",
    place: "Machame · on the slopes of Kilimanjaro",
    photos: ["machame1", "machame2"],
    intro:
      "Established in 2008 and welcoming visitors since 2011. Each woman plays a vital role, as a cook, weaver, artisan or educator sharing knowledge about environmental care and cultural heritage.",
    sections: [
      { title: "More than a visit", text: "They teach young people and visitors to preserve fading traditions, and encourage girls and boys alike to value education and hard work. Part of their earnings from cattle, chickens and bees supports orphans and the elderly in their community." },
    ],
  },
];

export const reviews = [
  { quote: "What stood out was the personal and extremely warm care, both in Germany during preparation and on site during our stay. Whenever something needed improving, our guides helped quickly and easily. We are completely satisfied.", name: "Klaus-Peter S.", from: "Neu-Ulm" },
  { quote: "Incredible! I never would have thought the trip would excite all of us so much. Beyond the great attractions, it was the local insights that will stay with us most. Cooking and eating together as a family in a Tanzanian home was the best.", name: "Annegret H.", from: "Stuttgart" },
  { quote: "We were thrilled by the individuality of our trip. From our first ideas, they tailored a two and a half week round trip just for us. A fantastic journey that we gladly recommend.", name: "Claudia F.", from: "Heilbronn" },
  { quote: "I think I've never been so close to a foreign culture in my life! The hospitality of the people was simply overwhelming. And even though there were only two of us, our services were never mixed with other groups.", name: "Markus C.", from: "Ludwigsburg" },
];

export const team = [
  {
    name: "Beatrice",
    role: "Operations Director",
    photo: "beatrice" as PhotoKey,
    text: "Your reliable and welcoming contact on the ground. Beatrice makes sure your journey runs smoothly from arrival to departure, is always reachable and handles any change quickly. With international experience from England and Norway and frequent visits to Germany, she understands travellers from all over the world.",
  },
  {
    name: "Nathan",
    role: "Head of Sales",
    photo: "nathan" as PhotoKey,
    text: "With deep knowledge of Tanzania's travel offerings and a passion for connecting people with unforgettable experiences, Nathan makes sure every enquiry is handled with care. He works closely with Beatrice to craft the perfect itinerary for each guest.",
  },
];

export const travelFaq = [
  { q: "When is the best time to travel?", a: "Tanzania can be visited all year round. December to February and June to October offer the most comfortable conditions. The long rains fall in April and May and the short rains in November, more noticeably in some regions than others. Kilimanjaro can be climbed year round." },
  { q: "Is Tanzania safe?", a: "Tanzania is one of the safest and most peaceful countries in Africa, with decades of stable democratic government, no conflicts between its more than 120 peoples, and Christians and Muslims living peacefully together. Our team is on call throughout your journey." },
  { q: "Do I travel with other tourists?", a: "No. Every journey is private and planned only for you and your companions. No fixed departure dates and no shared vehicles with strangers." },
  { q: "What kind of accommodation can I expect?", a: "Whatever suits you: tented camps close to nature, good-value local lodges, or 4 to 5 star hotels. On request we also arrange homestays with Tanzanian families." },
  { q: "How do I start planning?", a: "Fill in our trip planner, write to us on WhatsApp or by email, or book a free consultation by phone or video call. Planning with us is free and without obligation." },
  { q: "How warm is it?", a: "On the coast expect 27 to 35°C with 70 to 80% humidity. In the highlands days are a pleasant 22 to 30°C, with cool nights." },
];
