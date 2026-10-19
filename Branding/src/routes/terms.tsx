import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "../components/legal-page";
import { contact } from "../lib/contact";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | NELMA Drinking Water" },
      {
        name: "description",
        content:
          "The terms for ordering NELMA drinking water, including delivery, payment and subscription plans.",
      },
    ],
  }),
  component: TermsPage,
});

const sections: LegalSection[] = [
  {
    heading: "Who can order",
    paragraphs: [
      "Our services are for people aged 18 and over. If you are under 18, please ask a parent or guardian to order for you. They are responsible for the order.",
    ],
  },
  {
    heading: "Orders and prices",
    paragraphs: [
      "An order request on this website is not yet an order. Our customer care team will call you to confirm the price, delivery time and payment. The order exists once we have confirmed it with you.",
      "Prices shown on the website are for the products listed. The price we confirm when we call you is the price you pay, and a later price change does not affect an order we have already confirmed.",
    ],
  },
  {
    heading: "Delivery",
    paragraphs: [
      "We deliver to the address you give, at the time we agree with you. Times are our best estimate; traffic and weather can cause delays.",
      "Please make sure someone can receive the water and answer the phone. If our driver cannot reach you, we will contact you to arrange another time.",
    ],
  },
  {
    heading: "Payment",
    paragraphs: [
      "You pay the full amount in cash when your order is delivered, unless we agree another way with you in writing.",
      "Refills are for NELMA bottles you already have. A first-time purchase includes a new bottle.",
    ],
  },
  {
    id: "subscriptions",
    heading: "Subscription plans",
    paragraphs: [
      "A subscription plan means regular, scheduled deliveries. Plans are arranged with our customer care team. They cannot be bought on this website.",
      "Before a plan starts, we confirm it with you in writing by SMS, WhatsApp or email. That message states what you will receive, how often it will be delivered, the price of each delivery, how and when you pay, and how to cancel. The plan starts only after you agree.",
      "A plan does not renew by itself and nothing is charged to you automatically. You pay for each delivery in cash when it arrives.",
      `You can pause or cancel a plan at any time by telling us on ${contact.phone}, on WhatsApp ${contact.whatsapp} or at ${contact.email}. Cancelling stops all deliveries after the next one we have already scheduled. You only pay for water you have received.`,
    ],
  },
  {
    heading: "Problems with an order",
    paragraphs: [
      "If something is wrong with your water or delivery, contact us as soon as possible and we will work with you to put it right.",
    ],
  },
  {
    heading: "Using this website",
    paragraphs: [
      "Please give your real details and do not send false orders, spam or abuse. We may ignore requests that do this.",
      "We try to keep the website accurate and available, but we cannot promise it will always be free of errors or interruptions.",
    ],
  },
  {
    heading: "Privacy",
    paragraphs: ["How we handle your information is explained in our Privacy Policy at /privacy."],
  },
  {
    heading: "Changes and contact",
    paragraphs: [
      "We may update these terms. The date at the top of this page shows when they last changed.",
      `Questions? Contact NELMA Drinking Water on ${contact.phone} or at ${contact.email}. ${contact.address}.`,
    ],
  },
];

function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="19 October 2026"
      intro="These terms apply when you order NELMA drinking water through this website, by phone or by WhatsApp."
      sections={sections}
    />
  );
}
