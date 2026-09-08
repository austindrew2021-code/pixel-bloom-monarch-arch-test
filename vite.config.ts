import { copyFileSync, createReadStream, existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";
// @ts-expect-error JS plugin alongside the TS vite config
import { appEnvPlugin } from "./scripts/app-env-plugin.mjs";
import { isMigrationFile } from "./scripts/migration-plan.mjs";

function copyPgliteWasm(serverDir: string) {
  const src = join(process.cwd(), "node_modules/@electric-sql/pglite/dist");
  for (const name of ["pglite.wasm", "pglite.data", "initdb.wasm"]) {
    const from = join(src, name);
    if (existsSync(from)) copyFileSync(from, join(serverDir, name));
  }
}

function hideExerciseGifs() {
  const live = join(process.cwd(), "public/exercise-db/videos");
  const hidden = join(process.cwd(), ".spoonful-exercise-gifs");
  try {
    if (existsSync(live) && !existsSync(hidden)) renameSync(live, hidden);
  } catch (err) {
    console.warn("[spoonful] could not hide exercise gifs for deploy", err);
  }
}

function restoreExerciseGifs() {
  // Keep clips out of public/ so Publish never uploads them again.
  // Preview still serves them from .spoonful-exercise-gifs via exerciseGifPlugin.
}

/**
 * Nitro's vercel preset writes `config.json` + `.vc-config.json` in its own
 * `compiled` hook. Putting our own `hooks.compiled` on `nitro()` *replaces*
 * that (hookable overwrites the name), so Vercel/Grok prebuilt deploys ship a
 * function with no routing config and every request 500s as
 * `{ error: true, status: 500, unhandled: true }` even though `vite build`
 * exits 0 and a local `handler.fetch()` returns HTML.
 *
 * Copy wasm and backfill the Vercel files in a Vite closeBundle hook instead —
 * that *adds* work after Nitro, it does not replace Nitro's compiled step.
 *
 * Workout GIFs stay in the workspace for the live preview, but they are hidden
 * during `vite build` so Publish is not uploading 1,300 clips (that was the
 * timeout).
 */
function vercelOutputPlugin(): Plugin {
  return {
    name: "app-builder:vercel-output",
    apply: "build",
    buildStart() {
      hideExerciseGifs();
    },
    buildEnd(err) {
      if (err) restoreExerciseGifs();
    },
    closeBundle: {
      sequential: true,
      order: "post",
      handler() {
        try {
          const outputDir = join(process.cwd(), ".vercel/output");
          for (const dir of [join(outputDir, "static"), join(process.cwd(), "dist/client"), join(process.cwd(), "dist")]) {
            const apk = join(dir, "Spoonful-Test.apk");
            if (existsSync(apk)) unlinkSync(apk);
            const videos = join(dir, "exercise-db/videos");
            if (existsSync(videos)) rmSync(videos, { recursive: true, force: true });
          }
          const serverDir = join(outputDir, "functions/__server.func");
          if (!existsSync(join(serverDir, "index.mjs"))) return;
          copyPgliteWasm(serverDir);
          const vcConfig = join(serverDir, ".vc-config.json");
          if (!existsSync(vcConfig)) {
            writeFileSync(
              vcConfig,
              `${JSON.stringify(
                {
                  runtime: "nodejs22.x",
                  handler: "index.mjs",
                  launcherType: "Nodejs",
                  shouldAddHelpers: false,
                  supportsResponseStreaming: true,
                },
                null,
                2,
              )}\n`,
            );
          }
          const buildConfig = join(outputDir, "config.json");
          if (!existsSync(buildConfig)) {
            writeFileSync(
              buildConfig,
              `${JSON.stringify(
                {
                  version: 3,
                  routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/__server" }],
                },
                null,
                2,
              )}\n`,
            );
          }
        } finally {
          restoreExerciseGifs();
        }
      },
    },
  };
}

function permissionsPolicyPlugin(): Plugin {
  return {
    name: "spoonful-permissions-policy",
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("Permissions-Policy", "camera=(self), geolocation=(self), microphone=()");
        next();
      });
    },
  };
}

/** The files `src/lib/db.ts` globs — same directory, same non-recursive scope. */
function hasGlobbedMigrations(root: string): boolean {
  try {
    return readdirSync(join(root, "migrations")).some(isMigrationFile);
  } catch {
    return false;
  }
}

/**
 * Finish PGLite bootstrap during dev-server setup (before traffic). Vite awaits
 * async `configureServer` hooks. Production: `src/lib/db` kicks `ensureDbReady`
 * on import.
 *
 * Vite awaiting the hook puts this on time-to-first-render, so an app with no
 * migrations — no schema to apply — skips it entirely rather than paying for a
 * PGLite instance it never queries.
 */
function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "app-builder:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      if (!hasGlobbedMigrations(server.config.root)) return;
      try {
        const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
          ensureDbReady?: () => Promise<void>;
        };
        if (typeof mod.ensureDbReady === "function") {
          await mod.ensureDbReady();
        }
      } catch (err) {
        console.error("[app-builder] DB bootstrap failed:", err);
        throw err;
      }
    },
  };
}

/**
 * Live-preview OAuth popup — handled HERE so the agent never has to create a
 * `/auth/popup` route (and cannot break it by scaffolding a React page that
 * paints the full app shell in the popup).
 *
 * `signIn` (client.ts) opens `/auth/popup?providerId=…` in a top-level window.
 * This middleware runs before TanStack Start, calls `handleAuthPopupRequest`,
 * and returns the 302 / completion HTML. Deployed apps do not use the popup
 * (full-page OAuth redirect), so `apply: "serve"` is enough.
 */
function authPopupPlugin(): Plugin {
  return {
    name: "app-builder:auth-popup",
    apply: "serve",
    configureServer(server) {
      // Register immediately (not in a returned post-hook) so we run BEFORE
      // TanStack Start / the SPA HTML fallback. A model-authored
      // `src/routes/auth/popup.tsx` React page must never win this path.
      server.middlewares.use(async (req, res, next) => {
        try {
          const rawUrl = req.url ?? "";
          const pathOnly = rawUrl.split("?", 1)[0] ?? "";
          if (pathOnly !== "/auth/popup") {
            next();
            return;
          }
          if ((req.method ?? "GET").toUpperCase() !== "GET") {
            res.statusCode = 405;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("Method Not Allowed");
            return;
          }

          const host = String(
            req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080",
          );
          const proto = String(
            req.headers["x-forwarded-proto"] ??
              ((req.socket as { encrypted?: boolean } | undefined)?.encrypted ? "https" : "http"),
          );
          const requestHeaders = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) {
              for (const v of value) requestHeaders.append(key, v);
            } else {
              requestHeaders.set(key, value);
            }
          }
          // Ensure Host is the public preview host so Better Auth's dynamic
          // baseURL / redirect_uri match the popup origin.
          if (!requestHeaders.has("host")) requestHeaders.set("host", host);

          const request = new Request(`${proto}://${host}${rawUrl}`, {
            method: "GET",
            headers: requestHeaders,
          });

          const mod = (await server.ssrLoadModule("/src/lib/auth/popup.server.ts")) as {
            handleAuthPopupRequest: (req: Request) => Promise<Response>;
          };
          const response = await mod.handleAuthPopupRequest(request);

          res.statusCode = response.status;
          // Preserve multiple Set-Cookie headers (OAuth state + session).
          const setCookies =
            typeof response.headers.getSetCookie === "function"
              ? response.headers.getSetCookie()
              : [];
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") return;
            res.setHeader(key, value);
          });
          for (const cookie of setCookies) {
            res.appendHeader("set-cookie", cookie);
          }
          const body = Buffer.from(await response.arrayBuffer());
          res.end(body);
        } catch (err) {
          console.error("[app-builder] /auth/popup handler failed:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("auth popup failed");
          }
        }
      });
    },
  };
}

/**
 * Serve workout demonstration clips from artifacts in the live preview.
 * They stay out of `public/` so Publish is not uploading 1,300 GIFs.
 */
function exerciseGifPlugin(): Plugin {
  return {
    name: "spoonful-exercise-gifs",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
        if (!pathOnly.startsWith("/exercise-db/videos/")) {
          next();
          return;
        }
        const name = decodeURIComponent(pathOnly.slice("/exercise-db/videos/".length));
        if (!name || name.includes("..") || name.includes("/") || !name.endsWith(".gif")) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        const file = [
          join(server.config.root, ".spoonful-exercise-gifs", name),
          join(server.config.root, "public/exercise-db/videos", name),
          join(server.config.root, "artifacts/exercise-db/videos", name),
        ].find((p) => existsSync(p));
        if (!file) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        const { size } = statSync(file);
        res.statusCode = 200;
        res.setHeader("Content-Type", "image/gif");
        res.setHeader("Content-Length", String(size));
        res.setHeader("Cache-Control", "public, max-age=86400");
        createReadStream(file).pipe(res);
      });
    },
  };
}

/**
 * Serve the private Android test APK with a real download filename.
 * Grok's preview iframe often ignores a raw public/*.apk tap otherwise.
 */
function apkDownloadPlugin(): Plugin {
  return {
    name: "spoonful-apk-download",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
        if (pathOnly !== "/Spoonful-Test.apk" && pathOnly !== "/spoonful-test.apk") {
          next();
          return;
        }
        const file = [
          join(server.config.root, "public/Spoonful-Test.apk"),
          join(server.config.root, "artifacts/GET-THE-APP/Spoonful-Test.apk"),
          join(server.config.root, "artifacts/Spoonful-Test.apk"),
        ].find((p) => existsSync(p));
        if (!file) {
          res.statusCode = 404;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end("APK not found");
          return;
        }
        const { size } = statSync(file);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/vnd.android.package-archive");
        res.setHeader("Content-Disposition", 'attachment; filename="Spoonful-Test.apk"');
        res.setHeader("Content-Length", String(size));
        res.setHeader("Cache-Control", "no-store");
        createReadStream(file).pipe(res);
      });
    },
  };
}

// `0.0.0.0:8080` is the live-preview contract — don't change host/port.
// The dev server starts once `src/router.tsx` and `src/routes/` exist — see
// AGENTS.md § "First scaffold".
export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    headers: {
      "Permissions-Policy": "camera=(self), geolocation=(self), microphone=()",
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    pgliteBootstrapPlugin(),
    permissionsPolicyPlugin(),
    apkDownloadPlugin(),
    exerciseGifPlugin(),
    // Before tanstackStart so /auth/popup never falls through to the SPA.
    authPopupPlugin(),
    // Dev-only /__app-env, read by scripts/check-auth-invariant.mjs.
    appEnvPlugin(),
    // PWA head + ?install=1 tutorial page; runs before Start/Nitro.
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel",
            // Auto-registers server/middleware/* (the PWA install page +
            // manifest + head-tag middleware). Nitro v3 defaults serverDir to
            // false, so removing this silently unwires /?install=1 on deploys.
            serverDir: "./server",
            // Vite 8.2 + Rolldown re-exports an undeclared `ssr_exports`
            // across SSR chunks; every production request then 500s even
            // though `vite build` exits 0.
            // https://github.com/tanstack/router/issues/8031
            inlineDynamicImports: true,
          }),
          vercelOutputPlugin(),
        ]
      : []),
    viteReact(),
  ],
}));
