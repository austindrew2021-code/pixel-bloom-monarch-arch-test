import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc } from "@/components/legal-doc";

export const Route = createFileRoute("/health")({
  component: HealthPage,
});

function HealthPage() {
  return (
    <LegalDoc
      kicker="Health"
      title="Health and nutrition"
      updated="November 2, 2026"
      sections={[
        {
          heading: "Not medical advice",
          body: "Spoonful is a meal planner and a training log. It is not a doctor, dietitian, or physio. Nothing here diagnoses, treats, or prevents a condition. Talk to a clinician before changing how you eat or train, especially if you are pregnant, under 18, injured, or managing an illness.",
        },
        {
          heading: "Numbers are estimates",
          body: "Calories, protein, and the rest come from the recipe, from a barcode database, or from typical USDA-style values the chef estimates. Packages vary. A logged plate can be off. Body-fat and lean-mass figures are only as good as what you typed.",
        },
        {
          heading: "Training clips",
          body: "Form clips show the named movement so you can see the pattern. They are not a personal program and they don't know your joints. Stop if something hurts. A missed or skipped session only changes dinner suggestions — it is not a judgment.",
        },
        {
          heading: "Allergies",
          body: "Allergy flags hide recipes that look like a match. They can miss a hidden ingredient. Read the package and the method yourself.",
        },
      ]}
    />
  );
}
