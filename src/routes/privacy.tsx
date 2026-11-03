import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc } from "@/components/legal-doc";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalDoc
      kicker="Privacy"
      title="Privacy"
      updated="November 2, 2026"
      sections={[
        {
          heading: "What stays on the phone",
          body: "Dinners, pantry, cupboard checks, workouts, body numbers, and theme live in this browser until you clear them. Signing in can also keep a copy with your account so the kitchen is still there on another sign-in.",
        },
        {
          heading: "Account",
          body: "If you sign in, we store the email, name, and session that the sign-in creates, plus a username if you claim one. Passwords are stored by the sign-in system, not in the kitchen screens.",
        },
        {
          heading: "Messages",
          body: "Private chats are stored so the other person can read them. Only members of that chat can open it. We don't put chats on a public feed.",
        },
        {
          heading: "Barcode and Chef",
          body: "A barcode number is sent to Open Food Facts (world, Canada, and US) and, if needed, the USDA branded-food search, so we can name the package. A Chef prompt is sent to the kitchen's AI providers (xAI, and Groq when that key is configured) to plan a plate or explain the app. Don't put secrets in a prompt.",
        },
        {
          heading: "Health",
          body: "If you turn on step or health sync, those readings are used to adjust fuel for the day. They are not sold and they are not a medical record.",
        },
        {
          heading: "What we don't do",
          body: "We don't sell personal information. Ads don't run inside cook or shop. The optional kitchen short in Extras is the only ad-style slot, and it is off the dinner screens.",
        },
        {
          heading: "Delete",
          body: "Support has Clear this phone and Delete account. Deleting the account removes the sign-in. Clearing the phone wipes the kitchen stored on that device.",
        },
      ]}
    />
  );
}
