import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AccountControls, LegalDoc } from "@/components/legal-doc";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/support")({
  component: SupportPage,
});

function SupportPage() {
  return (
    <LegalDoc
      kicker="Support"
      title="Support"
      updated="November 2, 2026"
      sections={[
        {
          heading: "How to reach the kitchen",
          body: "During private testing, send the person who gave you the kitchen key a note — don't post the key. Copy the support note below and paste it to them. It includes the page you're on, not your meals or your body numbers.",
        },
        {
          heading: "What we can help with",
          body: "A barcode that names the wrong food, a chat that won't send, a form clip that stays still, a charge you didn't expect, or an account you want gone. For allergies or an injury, use a person, not this app.",
        },
      ]}
    >
      <Button
        className="mt-6 w-full"
        variant="secondary"
        onClick={async () => {
          const note = `Spoonful support\nPage: ${window.location.href}\nWhen: ${new Date().toISOString()}\nWhat happened: `;
          try {
            await navigator.clipboard.writeText(note);
            toast("Support note copied — paste it to whoever invited you");
          } catch {
            toast("Couldn't copy. Write down the time and what broke.");
          }
        }}
      >
        Copy a support note
      </Button>
      <AccountControls />
    </LegalDoc>
  );
}
