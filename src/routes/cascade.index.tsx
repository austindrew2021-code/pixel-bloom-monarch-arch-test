import { createFileRoute } from "@tanstack/react-router";
import { Cascade } from "@/components/arcade/cascade";
import { ArcadeQueryProvider } from "@/components/arcade/query-provider";
import { RedirectToSignIn, SignedIn, SignedOut } from "@/lib/auth/gates";

export const Route = createFileRoute("/cascade/")({ component: Page });

function Page() {
  return (
    <>
      <SignedIn>
        <ArcadeQueryProvider>
          <Cascade />
        </ArcadeQueryProvider>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
