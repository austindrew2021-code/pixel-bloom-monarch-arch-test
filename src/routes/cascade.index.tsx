import { createFileRoute } from "@tanstack/react-router";
import { Cascade } from "@/components/arcade/cascade";
import { RedirectToSignIn, SignedIn, SignedOut } from "@/lib/auth/gates";

export const Route = createFileRoute("/cascade/")({ component: Page });

function Page() {
  return (
    <>
      <SignedIn>
        <Cascade />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
