import { cn } from "@/lib/utils";

/** One shared copy for every diet/allergy filter, badge row and shield. Free for everyone. */
export const LABEL_NOTE = "Tags follow the printed recipe. Always check the labels on packaged ingredients.";

/** Small inline note: no popup, no focus, never blocks logging or cooking. */
export function LabelNote({ className }: { className?: string }) {
  return (
    <p className={cn("mt-1.5 text-xs leading-snug text-muted-foreground", className)} data-testid="label-note">
      {LABEL_NOTE}
    </p>
  );
}
