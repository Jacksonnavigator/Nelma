// Free-to-use photos from Unsplash (unsplash.com/license). Replace any of these with
// real photos of Prof. Kivevele's lab, dryers and events by dropping files into
// public/images and pointing the entry at "/images/your-file.jpg".

const unsplash = (id: string) => (w: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export type Photo = { src: (w: number) => string; alt: string };

const local = (path: string) => () => path;

export const photos = {
  portrait: { src: local("/images/portrait.jpg"), alt: "Prof. Thomas Kivevele" },
  solarFarm: { src: unsplash("1680355065203-43ad84bb6e69"), alt: "Rows of solar panels on a large solar farm" },
  kilimanjaro: { src: unsplash("1489392191049-fc10c97e64b6"), alt: "Mount Kilimanjaro rising above the clouds" },
  ruralSolar: { src: unsplash("1753881110611-00755160afd2"), alt: "Solar panels on a building in a rural landscape" },
  lab: { src: unsplash("1576089275954-40cd98bfcfdb"), alt: "Researchers working in a laboratory" },
  solarRoof: { src: unsplash("1671917057421-677f9cd99721"), alt: "Aerial view of a town with solar panels on a roof" },
  farmers: { src: unsplash("1746014929708-fcb859fd3185"), alt: "Farmers harvesting leafy greens in a field" },
  womenField: { src: unsplash("1708417145375-ed79c7131fab"), alt: "A group of women working in a field" },
  planting: { src: unsplash("1509099381441-ea3c0cf98b94"), alt: "A woman planting crops" },
  classroom: { src: unsplash("1744809482817-9a9d4fc280af"), alt: "A teacher instructing students in a classroom" },
  graduate: { src: unsplash("1686213011624-8578b598ef0f"), alt: "A graduate in a gown holding her certificate" },
  auditorium: { src: unsplash("1778876091112-f7e985acdb01"), alt: "A large auditorium filled with conference delegates" },
  panel: { src: unsplash("1754373695753-1069438691f8"), alt: "A panel discussion in front of an audience" },
  campus: { src: unsplash("1638636214032-581196ffd400"), alt: "Aerial view of a university building surrounded by trees" },
  mountainTrees: { src: unsplash("1613061445510-e296bfedb73e"), alt: "Green trees below a snow-capped mountain" },
  sunset: { src: unsplash("1678019028136-d0bfc70f4e26"), alt: "The sun setting over a dry landscape" },
} satisfies Record<string, Photo>;
