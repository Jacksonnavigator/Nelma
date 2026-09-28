import { LegalDocument, type LegalSection } from "../../components/legal/LegalDocument";
import { useOrders } from "../../store/order-context";

export default function TermsScreen() {
  const { supportInfo } = useOrders();
  const sections: LegalSection[] = [
    {
      heading: "Your account",
      paragraphs: [
        "You need an account to order. Give your real name and a phone number where the driver can reach you, and keep your password to yourself.",
        "You are responsible for orders placed from your account. Tell us straight away if you think someone else is using it."
      ]
    },
    {
      heading: "Orders and prices",
      paragraphs: [
        "Prices and delivery fees are shown before you confirm an order. The total on the order summary is what you pay.",
        "Prices can change, but a change never affects an order you have already placed.",
        "An order is accepted once it appears in your Orders list. We may cancel an order we cannot fulfil, for example if the address cannot be found or stock runs out, and we will tell you why."
      ]
    },
    {
      heading: "Delivery",
      paragraphs: [
        "We deliver to the address you give, in the time window you choose. Times are our best estimate; traffic and weather can cause delays.",
        "Please make sure someone can receive the water and answer the phone. If the driver cannot reach you, we will contact you to arrange another time.",
        "When your order arrives, check it and confirm in the app that you received it."
      ]
    },
    {
      heading: "Payment",
      paragraphs: [
        "Pay the full amount in cash when your order is delivered, unless another payment method is offered in the app.",
        "Refills are for NELMA bottles you already have. A first order includes a new bottle."
      ]
    },
    {
      heading: "Cancelling",
      paragraphs: [
        "You can cancel an order in the app until it is being prepared. After that, contact us and we will help if we can."
      ]
    },
    {
      heading: "Problems with an order",
      paragraphs: [
        "If something is wrong with your water or delivery, message us from the order or contact us as soon as possible and we will work with you to sort it out."
      ]
    },
    {
      heading: "Fair use",
      paragraphs: [
        "Do not misuse the app, place false orders, or harass our drivers or staff. We may suspend accounts that do."
      ]
    },
    {
      heading: "Changes and contact",
      paragraphs: [
        "We may update these terms. We will show the new date at the top and tell you in the app about important changes.",
        `Questions? Contact ${supportInfo.name} on ${supportInfo.phone} or ${supportInfo.email}.`
      ]
    }
  ];

  return (
    <LegalDocument
      title="Terms & Conditions"
      updated="28 September 2026"
      intro="These terms apply when you use the NELMA app to order drinking water. By creating an account you agree to them."
      sections={sections}
    />
  );
}
