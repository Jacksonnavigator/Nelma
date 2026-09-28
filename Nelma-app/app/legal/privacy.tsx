import { LegalDocument, type LegalSection } from "../../components/legal/LegalDocument";
import { useOrders } from "../../store/order-context";

export default function PrivacyScreen() {
  const { supportInfo } = useOrders();
  const sections: LegalSection[] = [
    {
      heading: "What we collect",
      paragraphs: [
        "Account details: your name, phone number and, if you give it, your email address.",
        "Delivery details: the addresses you enter or save, notes for the driver, and the map pin if you choose to share your location.",
        "Orders: what you buy, when, the price, payment status and any messages you send about an order.",
        "Device details: a notification token so we can send order alerts, if you allow notifications."
      ]
    },
    {
      heading: "How we use it",
      paragraphs: [
        "To take, prepare and deliver your orders, collect payment, and tell you how your order is going.",
        "To answer your questions and fix problems with an order.",
        "To keep sales and cash records that the business is required to keep.",
        "We do not sell your information and we do not use it for advertising from other companies."
      ]
    },
    {
      heading: "Who can see it",
      paragraphs: [
        "NELMA staff who handle orders can see your orders, contact details and messages.",
        "The driver delivering your order sees your name, phone number, delivery address and note, only for the deliveries assigned to them.",
        "Our information is stored with trusted cloud hosting providers who keep it on our behalf and may not use it for anything else.",
        "We share information with authorities only when the law requires it."
      ]
    },
    {
      heading: "Location",
      paragraphs: [
        "The app uses your location only when you tap to use it for a delivery address. It does not track customers in the background.",
        "Drivers share their position with NELMA while they are on duty and the app is open, so deliveries can be planned."
      ]
    },
    {
      heading: "Keeping it safe",
      paragraphs: [
        "Passwords are stored in a scrambled form that cannot be read back, and your sign-in is kept in your phone's secure storage.",
        "Information travels between the app and our servers over encrypted connections."
      ]
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "We keep your account while you use it. Order and payment records are kept for as long as accounting and tax rules require."
      ]
    },
    {
      heading: "Your choices",
      paragraphs: [
        "You can see and change your details in Profile, and switch order or payment alerts off in Notifications & settings.",
        "You can delete your account at any time in Profile > Password & security > Delete my account. Your personal details are removed; past order records remain without your name or contact details.",
        "You can also ask us for a copy of your information or to correct it by contacting us."
      ]
    },
    {
      heading: "Contact",
      paragraphs: [
        `${supportInfo.name}${supportInfo.address ? `, ${supportInfo.address}` : ""}.`,
        `Phone: ${supportInfo.phone}. Email: ${supportInfo.email}.`,
        "If we change this notice, we will update the date at the top and tell you in the app when the change is important."
      ]
    }
  ];

  return (
    <LegalDocument
      title="Privacy Policy"
      updated="28 September 2026"
      intro="This explains what information the NELMA app collects, why, and the choices you have. We only collect what we need to deliver your water."
      sections={sections}
    />
  );
}
