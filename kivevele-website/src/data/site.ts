import { photos, type Photo } from "./images";

export const contact = {
  emailPrimary: "thomas.kivevele@nm-aist.ac.tz",
  emailAlt: "kivevelethomas@gmail.com",
  phones: ["+255 714 120 930", "+255 743 667 804"],
  office: [
    "School of Materials, Energy, Water and Environmental Sciences",
    "Nelson Mandela African Institution of Science and Technology",
    "P.O. Box 447, Nelson Mandela Road",
    "Arusha, Tanzania",
  ],
};

export const heroSlides: { photo: Photo; title: string; caption: string }[] = [
  { photo: photos.solarFarm, title: "Clean energy for Africa", caption: "Solar, biofuel and heat pump systems built for local conditions" },
  { photo: photos.lab, title: "Research excellence", caption: "120+ peer-reviewed articles from the Sustainable Energy Lab" },
  { photo: photos.farmers, title: "Innovation in the field", caption: "Patented dryers that cut post-harvest losses for farmers" },
  { photo: photos.kilimanjaro, title: "Rooted in Arusha", caption: "Nelson Mandela African Institution of Science and Technology" },
];

export const heroRoles = ["Energy Engineer", "Innovator", "Research Leader"];

export const stats = [
  { value: "120+", label: "Peer-reviewed articles", detail: "In journals including Fuel, Energy, Solar Energy and Bioresource Technology" },
  { value: "$5M+", label: "Research funding secured", detail: "From the EU, World Bank, US National Academies, EPFL, IAEA and others" },
  { value: "6", label: "Registered patents", detail: "Solar dryers, a vaccine cooler, a biogas burner and a low-carbon cement" },
  { value: "48", label: "MSc and PhD graduates mentored", detail: "Students from Tanzania, Uganda, Nigeria, Congo, Zimbabwe and Mozambique" },
];

export const journey = [
  {
    title: "From the field",
    body: "Thomas began as an electro-mechanical engineer, sizing and commissioning power generators across Tanzania, including a 4 MW synchronised plant at Golden Jubilee Towers and backup power for new CRDB Bank branches. He then earned an M.Tech cum laude and a PhD in mechanical engineering at Tshwane University of Technology in South Africa.",
  },
  {
    title: "Building a research home",
    body: "Since joining NM-AIST in 2015 he has founded the Clean Energy Technologies Research Group and the Sustainable Energy Lab, risen to Associate Professor in 2023, and turned field problems such as rotting harvests and spoiled vaccines into six patented technologies.",
  },
  {
    title: "The work ahead",
    body: "As Director of Research and Innovation, he is leading NM-AIST into new partnerships such as the EU's LEAP-ENERGY PLUS and SUNRISE programmes, and helping Tanzania design innovation hubs, incubation programmes and research funds that will carry science into industry.",
  },
];

export type Innovation = { title: string; summary: string; tag: string; photo: Photo };

export const innovations: Innovation[] = [
  { title: "Solar–biogas hybrid dryer", summary: "Dries crops by sun during the day and by biogas at night. Patent TZ/P/2024/000032.", tag: "EU ARISE", photo: photos.planting },
  { title: "Solar-powered vaccine cooler", summary: "Holds vaccines and food at minus 10 °C in off-grid clinics. Patent TZ/P/2024/00096.", tag: "PASET RSIF", photo: photos.ruralSolar },
  { title: "Solar dryer with thermal storage", summary: "Rock-bed heat storage keeps drying going after sunset. Patent TZ/P/2023/000088.", tag: "US National Academies", photo: photos.womenField },
  { title: "Solar-assisted heat pump dryer", summary: "Energy-efficient drying for fruit, maize and groundnuts. Patent TZ/P/2023/000093.", tag: "PASET RSIF", photo: photos.solarRoof },
  { title: "Biofuels from non-food plants", summary: "Biodiesel and bio-jet fuel from croton, water hyacinth and farm waste, with natural antioxidants.", tag: "EPFL and UM6P", photo: photos.lab },
  { title: "Smart solar microgrids", summary: "Demand management, load forecasting and power quality for mini-grids in Arusha, Zanzibar and Lake Victoria.", tag: "EU Erasmus+", photo: photos.solarFarm },
  { title: "Waste to energy", summary: "Rice husk gasification and briquettes, and biogas from abattoir effluent, for agro-industries.", tag: "UNIDO", photo: photos.sunset },
  { title: "Clean energy skills for youth", summary: "Training 100+ marginalised young people, including youth with disabilities, in clean energy.", tag: "Fondation Botnar", photo: photos.classroom },
];

export const impact = [
  {
    icon: "flask",
    title: "Researcher and innovator",
    tagline: "Turning African energy problems into patented solutions",
    body: "Recognised as NM-AIST's Best Innovator of the Year and a Fulbright African Senior Research Scholar, he leads research that moves from the lab bench to farms and clinics.",
    points: ["Solar and hybrid drying technologies", "Biofuels and natural antioxidants", "Heat pumps and natural refrigerants", "Microgrids and smart energy systems"],
    photo: photos.lab,
  },
  {
    icon: "graduation",
    title: "Educator and mentor",
    tagline: "Training the engineers who will power the continent",
    body: "He has taught at university level since 2013 in Tanzania and South Africa, coordinates the MSc and PhD programmes in Sustainable Energy Science and Engineering, and examines for five universities.",
    points: ["19 MSc and 29 PhD students supervised", "Renewable and solar energy courses", "External examiner in Tanzania, Kenya and South Africa", "STEM mentoring for Arusha schools"],
    photo: photos.graduate,
  },
  {
    icon: "landmark",
    title: "Policy advisor and speaker",
    tagline: "Shaping how Tanzania funds and uses innovation",
    body: "Ministries, the National Planning Commission, UNIDO, the African Development Bank and IUCN call on him for clean energy and innovation policy, and he speaks at forums from Cape Town to Milan.",
    points: ["National innovation and incubation task forces", "Africa Energy Market Place 2024 for AfDB", "Keynote, World Science Forum 2022", "Visiting professor, Politecnico di Milano"],
    photo: photos.auditorium,
  },
];

export type Project = {
  title: string;
  role: string;
  funder: string;
  value: string;
  years: string;
  running: boolean;
  outcomes: string[];
};

export const projects: Project[] = [
  { title: "LEAP-ENERGY PLUS: long-term AU–EU research and innovation partnership on renewable energy", role: "Principal investigator, NM-AIST", funder: "EU Horizon Europe", value: "€4.0M total (NM-AIST €206,938)", years: "2026–2030", running: true, outcomes: ["Stronger AU–EU collaboration on deploying renewable energy", "Skills development in sustainable renewable energy", "Better commercialisation and links with industry"] },
  { title: "SUNRISE: Sustainable Universities for Renewable Innovation in Solar Energy", role: "Principal investigator, NM-AIST", funder: "EU Erasmus+", value: "€799,759 total (NM-AIST €75,815)", years: "2025–2028", running: true, outcomes: ["Modernised solar PV teaching with research and entrepreneurship", "Staff exchanges between Africa and Europe", "Labs upgraded with solar testing equipment and design software"] },
  { title: "Clean energy skills for marginalised Tanzanian youth, for climate resilience and wellbeing", role: "Principal investigator", funder: "u'GOOD (Fondation Botnar, NRF and HSRC)", value: "US$200,000", years: "2025–2028", running: true, outcomes: ["100+ marginalised youths trained in clean energy technologies", "A Tanzania Youth Climate Change Network and school climate clubs", "Evidence-based policy recommendations"] },
  { title: "Supercritical water gasification of Lake Victoria water hyacinth for high-value products", role: "Principal investigator", funder: "TWAS", value: "US$33,950", years: "2025–2026", running: true, outcomes: ["UV-Vis spectrophotometer and portable syngas analyser for the lab"] },
  { title: "\"Embodied energy\": low technologies for alternative energy in pastoralist communities", role: "Co-principal investigator", funder: "CNRS-Africa JRP, France", value: "€179,500", years: "2023–2027", running: true, outcomes: ["Bringing 20 idle biogas digesters in Meru District back into use", "Research support for one MSc student"] },
  { title: "Solar–biogas hybrid dryer for agricultural products", role: "Principal investigator", funder: "EU ARISE, African Academy of Sciences", value: "€400,000", years: "2022–2027", running: true, outcomes: ["Patented hybrid dryer (TZ/P/2024/000032)", "Full scholarships for 4 MSc and 3 PhD students", "Two women's groups trained and given capsule-making machines"] },
  { title: "Underused plants and farm waste for biofuels, to end fuel-versus-food competition", role: "Principal investigator", funder: "EPFL and UM6P, Excellence in Africa", value: "CHF 458,940", years: "2021–2027", running: true, outcomes: ["Full scholarships for 4 PhD students with research stays at EPFL", "Catalysts that upgrade vegetable oils to bio-jet-like fuel", "Seven Web of Science articles"] },
  { title: "Rice husk value chains and business models for biomass waste", role: "Lead consultant", funder: "UNIDO", value: "US$75,580", years: "2025–2026", running: false, outcomes: ["Value chain mapping and market analysis", "Business models for rice husk briquettes and bioenergy"] },
  { title: "Waste-to-energy capacity building for Tanzania's agro-industries (GEF-5)", role: "Lead consultant", funder: "UNIDO", value: "US$75,000", years: "2024–2025", running: false, outcomes: ["Workshops for policymakers, regulators, developers and banks"] },
  { title: "Solar-powered cooler for vaccines and perishable food in remote areas", role: "Co-principal investigator", funder: "PASET RSIF", value: "US$84,000", years: "2022–2024", running: false, outcomes: ["Off-grid cooler reaching minus 10 °C (patent TZ/P/2024/00096)", "Awareness reaching 100+ stakeholders"] },
  { title: "Solar dryer integrated with energy storage for drying biomaterials", role: "Principal investigator", funder: "US National Academies (PEER)", value: "US$136,916", years: "2021–2023", running: false, outcomes: ["Patented dryer (TZ/P/2023/000088) installed at TAHA, Tengeru", "Two articles in ACS Omega"] },
  { title: "Solar-assisted heat pump dryer with energy storage", role: "Principal investigator", funder: "PASET RSIF", value: "US$81,133", years: "2020–2023", running: false, outcomes: ["Patent TZ/P/2023/000093", "Three Web of Science articles"] },
  { title: "EWA-BELT: sustainable farming systems across East and West Africa", role: "Co-investigator", funder: "EU Horizon 2020", value: "€194,000", years: "2020–2024", running: false, outcomes: ["A seaweed-based method that stops crops taking up fluoride from soil"] },
  { title: "Erasmus+ mobility with TU Dresden and Budapest University of Technology", role: "Principal investigator, NM-AIST", funder: "European Commission", value: "24 exchanges, €92,104", years: "2019–2023", running: false, outcomes: ["Staff and student exchanges between Tanzania, Germany and Hungary"] },
  { title: "Solar-assisted heat pump drying for industry and agriculture", role: "Principal investigator", funder: "COSTECH", value: "TZS 100.9M", years: "2019–2021", running: false, outcomes: ["Demonstrations for 200+ people in Arusha, Mafinga and Tabora"] },
  { title: "Graduate School of Nuclear Science and Technology at NM-AIST", role: "Co-principal investigator", funder: "IAEA, with TAEC", value: "€334,080", years: "2018–2019", running: false, outcomes: ["Three accredited MSc programmes in nuclear science"] },
  { title: "WISE-Futures African Centre of Excellence", role: "Head of research and innovation", funder: "World Bank ACE II", value: "US$6.0M centre budget", years: "2016–2022", running: false, outcomes: ["German AQAS accreditation that brought US$300,000 to the centre"] },
  { title: "DAMOC: a harmonised modular curriculum for the smart grid", role: "Co-principal investigator", funder: "EU Erasmus+", value: "€882,397 total", years: "2016–2019", running: false, outcomes: ["Smart grids added to the MSc and PhD programmes", "Founded what is now the Sustainable Energy Lab"] },
];

export const awards = [
  { year: "2025/26", title: "Research Excellence Award", by: "Ministry of Education, Science and Technology" },
  { year: "2020/21", title: "Best Innovator of the Year", by: "NM-AIST" },
  { year: "2019/20", title: "Best Worker, academic staff", by: "NM-AIST" },
  { year: "2018", title: "Fulbright African Senior Research Scholar", by: "Baylor University, Texas" },
  { year: "2012", title: "S2A3 Bronze Medal for best master's student", by: "Tshwane University of Technology" },
];

export const partners = [
  "European Union", "World Bank", "African Academy of Sciences", "US National Academies", "Fulbright", "EPFL", "IAEA", "UNIDO",
  "African Development Bank", "TWAS", "CNRS", "Politecnico di Milano", "TU Dresden", "Baylor University", "Purdue University", "COSTECH",
];

export const education = [
  { degree: "PhD, Mechanical Engineering (Thermal Energy)", school: "Tshwane University of Technology, South Africa", year: "2015" },
  { degree: "M.Tech, Mechanical Engineering (Bio-Energy), cum laude", school: "Tshwane University of Technology, South Africa", year: "2011" },
  { degree: "B.Sc. (Hons), Electro-Mechanical Engineering", school: "University of Dar es Salaam, Tanzania", year: "2007" },
];

export const career = [
  { period: "2024–2027", role: "Director, Directorate of Research and Innovation", org: "NM-AIST" },
  { period: "2023–now", role: "Associate Professor, Sustainable Energy Engineering", org: "NM-AIST" },
  { period: "2020–2023", role: "Senior Lecturer and researcher", org: "NM-AIST" },
  { period: "2016–2020", role: "Lecturer and researcher", org: "NM-AIST" },
  { period: "2015–2016", role: "Lecturer, refrigeration and air conditioning", org: "Mbeya University of Science and Technology" },
  { period: "2013–2015", role: "Part-time lecturer and PhD researcher", org: "Tshwane University of Technology" },
  { period: "2007–2012", role: "Service engineer, then head of power division", org: "Merrywater Ltd, Dar es Salaam" },
];

export const service = [
  { year: "2026", text: "National Planning Commission study on business incubation and job creation in Tanzania" },
  { year: "2026", text: "Ministry of Agriculture expert team for a national agricultural research and innovation guideline" },
  { year: "2025", text: "Team leader reviewing the proposal for National Innovation Commercialisation Hubs (NICE-HUBS)" },
  { year: "2025", text: "Tanzanian delegation to China on solar-assisted tobacco curing" },
  { year: "2025–26", text: "Team leader, e-cooking carbon credits pilot in Arusha with OffGridSun and Politecnico di Milano" },
  { year: "2024", text: "Clean energy expert for the African Development Bank's Africa Energy Market Place 2024 in Tanzania" },
  { year: "2024–25", text: "Committee designing the Joint Universities Research and Innovation Basket Fund" },
  { year: "2020–21", text: "Lead consultant comparing solar and diesel irrigation pumps in Kilimanjaro for TAHA" },
];

export const talks = [
  { title: "Energy challenges in Africa: innovative pathways and solutions", where: "Politecnico di Milano, Italy", year: "2025" },
  { title: "Solar–biogas hybrid dryer: an energy-efficient technology for drying agricultural products", where: "ARISE high-level scientific event, Tunisia", year: "2024" },
  { title: "The significance of solar dryers in addressing post-harvest losses for urban Africa's food security", where: "Borobudur International Symposium", year: "2023" },
  { title: "The role of solar dryers in food security in urban Africa", where: "World Science Forum, Cape Town", year: "2022" },
];
