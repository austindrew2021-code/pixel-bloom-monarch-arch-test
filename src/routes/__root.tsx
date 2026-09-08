import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useLayoutEffect, type CSSProperties } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { htmlLang } from "@/lib/i18n";
import { useSpoonful } from "@/lib/spoonful-store";
import { normalizeTheme, themeById } from "@/lib/themes";
import appCss from "../styles.css?url";

const APP_NAME = "Spoonful";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content: "The meal planner that plates dinner from your fridge and your workout. Simple Kitchen or Next Gen Fuel.",
      },
      { name: "permissions-policy", content: "camera=(self), geolocation=(self), microphone=()" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "googlebot", content: "noindex, nofollow, noarchive" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,800&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const theme = useSpoonful((s) => s.theme);
  const nextGen = useSpoonful((s) => s.nextGen);
  const locale = useSpoonful((s) => s.locale);
  const look = themeById(normalizeTheme(theme));
  const pageStyle = {
    backgroundColor: look.swatch[0],
  } as CSSProperties;

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = look.id;
    root.dataset.ease = nextGen ? "next" : "simple";
    root.dataset.art = look.art ? "1" : "0";
    root.style.backgroundColor = look.swatch[0];
    root.style.backgroundImage = "none";
  }, [look, nextGen]);

  return (
    <html
      lang={htmlLang(locale)}
      data-theme={look.id}
      data-ease={nextGen ? "next" : "simple"}
      data-art={look.art ? "1" : "0"}
      style={pageStyle}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body className="antialiased" style={{ backgroundColor: "transparent" }} suppressHydrationWarning>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
