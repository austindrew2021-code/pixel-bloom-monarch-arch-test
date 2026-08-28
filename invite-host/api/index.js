/**
 * Invite host for iPhone testers. Serves Spoonful as a home-screen app
 * on a clean URL and reverse-proxies the live kitchen, stripping builder chrome.
 */
const ORIGIN = "https://pixel-bloom-monarch-arch.grok.me";
const ORIGIN_HOST = "pixel-bloom-monarch-arch.grok.me";

const HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "content-encoding",
  "cf-connecting-ip",
  "cf-ipcountry",
  "cf-ray",
  "cf-visitor",
  "x-forwarded-host",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-real-ip",
  "x-vercel-id",
  "x-vercel-forwarded-for",
  "x-vercel-ip-country",
  "x-invoke-path",
  "x-invoke-query",
]);

export const config = { runtime: "edge" };

export function scrubHtml(html, publicOrigin) {
  let out = String(html ?? "");
  out = out.replace(/<script\b[^>]*grok-app-builder\/extensions\.js[^>]*>\s*<\/script>/gi, "");
  out = out.replace(/<script\b[^>]*src=["'][^"']*grok\.com[^"']*["'][^>]*>\s*<\/script>/gi, "");
  out = out.replace(
    /<meta\b[^>]*(?:name|property)=["'](?:grok-project-id|grok:app_id|x:creator|x:creator:id)["'][^>]*>/gi,
    "",
  );
  out = out.replace(/https?:\/\/pixel-bloom-monarch-arch\.grok\.me/gi, publicOrigin);
  out = out.replace(/https?:\/\/og\.grok\.me\/[^"'>\s]*/gi, `${publicOrigin}/og.jpg`);
  out = out.replace(/href=["']\/__grok\/manifest\.webmanifest["']/g, 'href="/manifest.webmanifest"');
  out = out.replace(/href=["']\/__grok\/icon-180\.png["']/g, 'href="/icons/icon-180.png"');
  out = out.replace(/content=["']Pixel Bloom Monarch Arch["']/g, 'content="Spoonful"');
  out = out.replace(/<title>\s*Pixel Bloom Monarch Arch\s*<\/title>/i, "<title>Spoonful</title>");
  if (!/apple-mobile-web-app-capable/i.test(out)) {
    out = out.replace(
      /<head[^>]*>/i,
      (open) => `${open}<meta name="apple-mobile-web-app-capable" content="yes">`,
    );
  }
  if (!/apple-mobile-web-app-title/i.test(out)) {
    out = out.replace(
      /<head[^>]*>/i,
      (open) => `${open}<meta name="apple-mobile-web-app-title" content="Spoonful">`,
    );
  }
  return out;
}

function copyRequestHeaders(request) {
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (HOP.has(key.toLowerCase())) continue;
    headers.set(key, value);
  }
  headers.set("host", ORIGIN_HOST);
  headers.set("accept-encoding", "identity");
  return headers;
}

function rewriteSetCookie(value) {
  return String(value)
    .replace(/;\s*Domain=[^;]*/gi, "")
    .replace(/;\s*domain=[^;]*/gi, "");
}

function copyResponseHeaders(originRes, publicHost, dropLength) {
  const headers = new Headers();
  originRes.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (HOP.has(k)) return;
    if (k === "set-cookie") return;
    if (dropLength && (k === "content-length" || k === "content-encoding")) return;
    if (k === "location") {
      headers.set(
        key,
        value.replaceAll(ORIGIN, `https://${publicHost}`).replaceAll(ORIGIN_HOST, publicHost),
      );
      return;
    }
    headers.set(key, value);
  });
  const cookies =
    typeof originRes.headers.getSetCookie === "function"
      ? originRes.headers.getSetCookie()
      : originRes.headers.get("set-cookie")
        ? [originRes.headers.get("set-cookie")]
        : [];
  for (const cookie of cookies) {
    if (cookie) headers.append("set-cookie", rewriteSetCookie(cookie));
  }
  headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  return headers;
}

function kitchenPath(request) {
  const incoming = new URL(request.url);
  const fromQuery = incoming.searchParams.get("__p");
  if (fromQuery) return fromQuery.startsWith("/") ? fromQuery : `/${fromQuery}`;
  if (incoming.pathname === "/api" || incoming.pathname === "/api/") return "/";
  if (incoming.pathname.startsWith("/api/")) {
    const rest = incoming.pathname.slice("/api".length);
    return rest || "/";
  }
  return incoming.pathname || "/";
}

function kitchenSearch(request) {
  const incoming = new URL(request.url);
  incoming.searchParams.delete("__p");
  const rest = incoming.searchParams.toString();
  return rest ? `?${rest}` : "";
}

export default async function handler(request) {
  const incoming = new URL(request.url);
  const path = kitchenPath(request);

  if (path === "/__grok/manifest.webmanifest" || path === "/__grok/manifest.json") {
    return Response.redirect(new URL("/manifest.webmanifest", incoming.origin), 302);
  }
  if (path === "/__grok/icon-180.png") {
    return Response.redirect(new URL("/icons/icon-180.png", incoming.origin), 302);
  }
  if (path.startsWith("/__grok/")) {
    return new Response("Not found", { status: 404 });
  }

  const target = new URL(path + kitchenSearch(request), ORIGIN);
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const init = {
    method,
    headers: copyRequestHeaders(request),
    redirect: "manual",
  };
  if (hasBody) {
    init.body = request.body;
    init.duplex = "half";
  }

  const originRes = await fetch(target, init);
  const publicHost = incoming.host;
  const contentType = originRes.headers.get("content-type") ?? "";

  if (contentType.includes("text/html")) {
    const html = await originRes.text();
    const cleaned = scrubHtml(html, incoming.origin);
    const headers = copyResponseHeaders(originRes, publicHost, true);
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("cache-control", "no-store");
    return new Response(cleaned, { status: originRes.status, headers });
  }

  return new Response(originRes.body, {
    status: originRes.status,
    statusText: originRes.statusText,
    headers: copyResponseHeaders(originRes, publicHost, false),
  });
}
