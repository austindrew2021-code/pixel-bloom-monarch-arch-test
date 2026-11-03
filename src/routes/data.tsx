import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc } from "@/components/legal-doc";

export const Route = createFileRoute("/data")({
  component: DataPage,
});

function DataPage() {
  return (
    <LegalDoc
      kicker="Data safety"
      title="Data the app uses"
      updated="November 2, 2026"
      sections={[
        {
          heading: "Collected if you use the feature",
          body: "Account email and name, when you sign in. Username, recipes you publish, and private messages, when you use People. Kitchen contents on the device: meals, pantry, shop list, workouts, body stats, photos you attach. Barcode digits sent to food databases. Chef text sent to the AI provider. Steps or workouts, if you connect a health source. A rough location only if you ask for nearby stores.",
        },
        {
          heading: "Not collected",
          body: "No sale of personal data. No ad tracking across other apps. No contacts list. The camera is used only while you scan or snap, and the photo stays unless you save it into the kitchen.",
        },
        {
          heading: "Why",
          body: "To plan dinner, fill a list, log a plate, show a form clip, and deliver a message you sent. Security and fraud checks are the sign-in system's, not a separate profile on you.",
        },
        {
          heading: "Sharing",
          body: "Open Food Facts and USDA receive the barcode, not your name. The AI provider receives the chef prompt, not your password. A chat is shared with the people you added to it. Apple or Google receive payment details only if you buy through their store.",
        },
        {
          heading: "Deletion",
          body: "Support explains how to clear this phone and delete the account. That is the in-app path the stores ask for.",
        },
      ]}
    />
  );
}
