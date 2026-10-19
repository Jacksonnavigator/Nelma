import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "../components/legal-page";
import { contact } from "../lib/contact";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | NELMA Drinking Water" },
      {
        name: "description",
        content:
          "What information the NELMA website collects, why, who sees it and the choices you have.",
      },
    ],
  }),
  component: PrivacyPage,
});

const sections: LegalSection[] = [
  {
    heading: "Who we are",
    paragraphs: [
      `NELMA Drinking Water, ${contact.address}. We produce and deliver drinking water for the NM-AIST community and Arusha. This notice covers this website. The NELMA mobile app has its own privacy policy inside the app.`,
      `You can reach us on ${contact.phone} or at ${contact.email}.`,
    ],
  },
  {
    heading: "What we collect",
    paragraphs: [
      "Contact form: your name, email address and message.",
      "Order form: whether you are a new or existing customer, your name, company (or home), email address, phone number, delivery area and address, the product and quantity you want, and any delivery instructions you write.",
      "We do not ask for passwords or payment card details on this website. You pay in cash when your water is delivered.",
      "We do not use advertising, tracking or analytics tools on this website, and we do not record what you do on it.",
    ],
  },
  {
    heading: "Why we use it",
    paragraphs: [
      "Only to reply to your message, to call you back about your order, to confirm the price, delivery time and payment, and to deliver your water.",
      "We keep a record of orders because the business must keep sales and cash records.",
      "We do not sell your information, and we do not use it to send you advertising from other companies.",
    ],
  },
  {
    heading: "Who can see it",
    paragraphs: [
      "NELMA customer care staff, and the driver who delivers your order if you place one.",
      "Your details are stored with trusted cloud service providers who host the NELMA system for us and may not use the information for anything else.",
      "We share information with the authorities only when the law requires it.",
    ],
  },
  {
    heading: "Google Maps and downloads",
    paragraphs: [
      "The map of our office is provided by Google. It loads only after you tap Show map. When it loads, Google receives your internet address and may set its own cookies. If you prefer, use the Open in Google Maps link instead, or skip the map.",
      "The Android app file is downloaded from GitHub, which receives your internet address when you download it.",
      "This website loads its text and fonts from our own servers, not from Google.",
    ],
  },
  {
    heading: "Cookies",
    paragraphs: ["This website does not set advertising or tracking cookies."],
  },
  {
    heading: "Children",
    paragraphs: [
      "Our services are for people aged 18 and over. We do not knowingly collect information from children without a parent or guardian's permission. If you think a child has sent us their details, contact us and we will delete them.",
    ],
  },
  {
    heading: "How long we keep it",
    paragraphs: [
      "Messages and order requests are kept only as long as we need them to deal with your request and keep our records. Order and payment records are kept for as long as accounting and tax rules require.",
    ],
  },
  {
    heading: "Your choices",
    paragraphs: [
      `You can ask us for a copy of the information we hold about you, to correct it, to delete it, or to stop using it. Contact us on ${contact.phone} or at ${contact.email} and we will help.`,
      "If you are not happy with how we handle your information, you can complain to Tanzania's Personal Data Protection Commission.",
    ],
  },
  {
    heading: "Changes",
    paragraphs: ["If we change this notice we will update the date at the top of this page."],
  },
];

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="19 October 2026"
      intro="This explains what information the NELMA website collects, why, and the choices you have. We only collect what we need to answer you and deliver your water."
      sections={sections}
    />
  );
}
