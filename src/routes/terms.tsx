import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc } from "@/components/legal-doc";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalDoc
      kicker="Terms"
      title="Terms"
      updated="November 2, 2026"
      sections={[
        {
          heading: "The kitchen",
          body: "Spoonful plans meals, a grocery list, and optional training. Recipes, cook mode, Snap, barcode lookup, Fuel, and Shop stay free. You use the app as a home cook, not as a clinic or a grocery checkout.",
        },
        {
          heading: "Prices you see first",
          body: "Paid extras are listed in Extras before you tap: Kitchen Table $7.99 a month or $69.99 a year, Kitchen+ $5.99 a month, Family table $4.99 a month, Founder $49 once, Gift a Table $7.99 once, Trainer $19 a month, Team kitchen $29 once, Weeknight SOS $2.99, chef plate packs $2.99 or $5.99, streak save $1.99 when a streak actually breaks, tips $3 or $8. In this test kitchen, Interac is a memo you send yourself. Tapping “I've sent it” does not charge a card.",
        },
        {
          heading: "App Store and Google Play",
          body: "If you buy through Apple or Google, that store bills you and their subscription rules apply. Monthly plans renew until you cancel in the store's subscription settings, not inside Spoonful. One-time items don't renew.",
        },
        {
          heading: "Your food",
          body: "You're responsible for allergies, food safety, and whether a barcode match is the package in your hand. Estimates can be wrong. Don't ignore a label because the app said otherwise.",
        },
        {
          heading: "Accounts",
          body: "Don't share a kitchen key in public. You can delete an account from Support. We can suspend an account that abuses chat.",
        },
      ]}
    />
  );
}
