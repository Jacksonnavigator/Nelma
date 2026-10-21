// Every photo on the site. Each one is looked for in public/images/<name> first.
// Until `npm run fetch-images` has copied them in, the copy on the current
// realtzdiscovery.co.tz site is used instead (see components/Photo.tsx).
// scripts/fetch-images.mjs reads this same list.

export const REMOTE_BASE = "https://realtzdiscovery.co.tz/assets/";

export const photos = {
  safariHero: { file: "safari-hero.jpg", remote: "safari-new-1-CNbIkFO0.jpg", alt: "Safari vehicle and guests on a game drive in Tanzania" },
  safariPlains: { file: "safari-plains.jpg", remote: "safari-new-2-D0Jea6sC.jpg", alt: "Open plains of a Tanzanian national park" },
  serengeti: { file: "serengeti.jpg", remote: "safari-new-3-BJXCw1eD.jpg", alt: "Wildlife on the Serengeti plains" },
  ngorongoro: { file: "ngorongoro.jpg", remote: "safari-new-4-bhyPNT9k.jpg", alt: "Inside the Ngorongoro Crater" },
  cheetah: { file: "cheetah.jpg", remote: "cheetah-serengeti-s56J_oAq.jpg", alt: "Cheetah in the Serengeti" },
  lionsSunset: { file: "lions-sunset.jpg", remote: "impact-safari-wildebeest-BWstLfQ6.jpg", alt: "Lions resting on a rocky outcrop at sunset in the Serengeti" },
  elephantZebras: { file: "elephant-zebras.jpg", remote: "safari-elephant-zebras-BeLgCXhV.jpg", alt: "Elephant and zebras at a watering hole" },
  zebrasRiver: { file: "zebras-river.jpg", remote: "safari-zebras-river-DLs2BwNx.jpg", alt: "Herd of zebras crossing a river" },
  giraffes: { file: "giraffes.jpg", remote: "newsletter-giraffes-BRo_CpdQ.jpg", alt: "Giraffes beside a safari vehicle" },
  tarangire: { file: "tarangire.jpg", remote: "itinerary-tarangire-Be6vgGuw.jpg", alt: "Elephants and baobabs in Tarangire National Park" },
  manyara: { file: "manyara.jpg", remote: "itinerary-manyara-CscvkVMc.jpg", alt: "Lake Manyara National Park" },
  natron: { file: "natron.jpg", remote: "itinerary-natron-DXBbO03p.jpg", alt: "Lake Natron landscape" },
  arusha: { file: "arusha.jpg", remote: "itinerary-arusha-DGQTPG-D.jpg", alt: "Arrival in Arusha" },
  departure: { file: "departure.jpg", remote: "itinerary-departure-D-HoCYXg.jpg", alt: "Farewell from Tanzania" },
  kiliSummit: { file: "kilimanjaro-summit.jpg", remote: "kilimanjaro-summit-qWqRiuPv.jpg", alt: "Climbers celebrating at the Kilimanjaro summit" },
  kiliGroup: { file: "kilimanjaro-group.jpg", remote: "kilimanjaro-group-DHUrR5b5.jpg", alt: "Trekking group ready for the Kilimanjaro climb" },
  kiliGate: { file: "kilimanjaro-gate.jpg", remote: "kilimanjaro-gate-Cwy6LFNw.jpg", alt: "Group photo at the Marangu Gate of Kilimanjaro National Park" },
  kiliClouds: { file: "kilimanjaro-clouds.jpg", remote: "kilimanjaro-routes-hero-ByOQMUl9.jpg", alt: "Kilimanjaro rising above a sea of clouds" },
  kiliRidge: { file: "kilimanjaro-ridge.jpg", remote: "kilimanjaro-ridge-BgH71dzQ.jpg", alt: "Trekkers on a Kilimanjaro ridge above the clouds" },
  culturalBuffet: { file: "cultural-buffet.jpg", remote: "cultural-buffet-DckO7Uws.jpg", alt: "Traditional Tanzanian buffet under a thatched roof" },
  culturalCooking: { file: "cultural-cooking.jpg", remote: "cultural-cooking-yAwKNkv0.jpg", alt: "Cooking traditional food with a local family" },
  sameCooking: { file: "same-cooking.jpg", remote: "same-cooking-D74nZXkV.jpg", alt: "Women of Same cooking together under a tree" },
  sameWomen: { file: "same-women.jpg", remote: "same-cultural-women-CLyvxp3m.jpg", alt: "Women of the Same cultural tour group" },
  sameFarming: { file: "same-farming.jpg", remote: "same-farming-CIxAU_5F.jpg", alt: "A guest joining the Same community in farming" },
  machame1: { file: "machame-women.jpg", remote: "machame-women-DIHgz7XH.jpg", alt: "Machame Nkweshoo women's group" },
  machame2: { file: "machame-kitchen.jpg", remote: "machame-women-2-B3Mx9fOh.jpg", alt: "A guest cooking in a traditional Machame kitchen" },
  vikindu1: { file: "vikindu-1.jpg", remote: "vikindu-1-DXTA7RAz.jpg", alt: "Visit to the Vikindu Mama na Mwana Foundation" },
  vikindu2: { file: "vikindu-2.jpg", remote: "vikindu-2-OuNHTE2n.jpg", alt: "Families at the Vikindu homestay" },
  vikindu3: { file: "vikindu-3.jpg", remote: "vikindu-3-BNtObhMS.jpg", alt: "Guests with the Mama na Mwana community" },
  vikindu4: { file: "vikindu-4.jpg", remote: "vikindu-4-BN2Ssb9R.jpg", alt: "Community moment in Vikindu" },
  zanzibarWomen: { file: "zanzibar-women.jpg", remote: "zanzibar-women-COJ_Xrhm.jpg", alt: "Women in the shallow turquoise water of Zanzibar" },
  zanzibarBeach: { file: "zanzibar-beach.jpg", remote: "zanzibar-beach-iGm2_EAi.jpg", alt: "White sand beach on Zanzibar" },
  zanzibarDhows: { file: "zanzibar-dhows.jpg", remote: "zanzibar-beach-dhows-CcbgH6UY.jpg", alt: "Dhows on a Zanzibar beach" },
  stoneTown: { file: "stone-town.jpg", remote: "zanzibar-stonetown-C9pdcpKo.jpg", alt: "Stone Town, Zanzibar" },
  mafia: { file: "mafia-island.jpg", remote: "mafia-island-coast-DpcOvuRo.jpg", alt: "Mafia Island coastline at sunset" },
  kilwa: { file: "kilwa.jpg", remote: "kilwa-coast-DuV56fwR.jpg", alt: "Historic Kilwa Kisiwani ruins by the turquoise sea" },
  pangani: { file: "pangani.jpg", remote: "pangani-coast-BvcCvpCj.jpg", alt: "Palm-lined Pangani coastline from above" },
  bagamoyo: { file: "bagamoyo.jpg", remote: "bagamoyo-coast-DK5rvkZw.jpg", alt: "Bagamoyo coast from above" },
  aboutSunset: { file: "about-sunset.jpg", remote: "about-hero-sunset-DOED_bh6.jpg", alt: "Our team with guests at sunset" },
  aboutTradeShow: { file: "about-trade-show.jpg", remote: "about-quote-night-BCgEL2q1.jpg", alt: "Real Tanzania Discovery Adventures at a travel trade show" },
  realAfricaLogo: { file: "real-africa-logo.png", remote: "real-africa-logo-CQfFEN8m.png", alt: "Real Africa logo" },
} as const;

export type PhotoKey = keyof typeof photos;
