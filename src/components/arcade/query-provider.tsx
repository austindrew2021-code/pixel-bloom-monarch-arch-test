import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * React Query scoped to the Cascade routes.
 *
 * Deliberately not hoisted into the app's root route: nothing else in this
 * workspace uses React Query, and adding a provider there would put every other
 * page behind a client this feature owns.
 *
 * The client is held in state so it is created once per mount rather than on
 * every render — a fresh QueryClient each render throws away the cache and
 * re-fires every query.
 */
export function ArcadeQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Season and board data moves on its own; refetching on every window
            // focus would hammer the server for little gain.
            refetchOnWindowFocus: false,
            staleTime: 10_000,
            retry: 1,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
