import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

const stub = resolve("src/apk-stubs/empty.ts");
const startStub = resolve("src/apk-stubs/react-start.ts");

function classicScripts(): Plugin {
  return {
    name: "apk-classic-scripts",
    transformIndexHtml(html) {
      const cleaned = html
        .replaceAll('type="module" crossorigin', "")
        .replaceAll('type="module"', "")
        .replaceAll(" crossorigin", "")
        .replaceAll("<script  src", "<script src")
        .replace(/<link rel="modulepreload"[^>]*>/g, "");
      const scripts: string[] = [];
      const without = cleaned.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/g, (tag) => {
        scripts.push(tag);
        return "";
      });
      if (!scripts.length) return without;
      return without.replace("</body>", `    ${scripts.join("\n    ")}\n  </body>`);
    },
  };
}

/** Client-only kitchen for the Android test APK — no SSR, no Nitro. */
export default defineConfig({
  plugins: [react(), tailwindcss(), classicScripts()],
  publicDir: resolve("apk-public"),
  base: "./",
  define: {
    "import.meta.env.VITE_AUTH_ENABLED": JSON.stringify("false"),
  },
  resolve: {
    alias: [
      { find: "@tanstack/react-start/server", replacement: stub },
      { find: "@tanstack/react-start", replacement: startStub },
      { find: "@/lib/community", replacement: resolve("src/apk-stubs/community.ts") },
      { find: "@/lib/family", replacement: resolve("src/apk-stubs/family.ts") },
      { find: "@/lib/kitchen-ai", replacement: resolve("src/apk-stubs/kitchen-ai.ts") },
      { find: "@/lib/ai-chef", replacement: resolve("src/apk-stubs/ai-chef.ts") },
      { find: "@/lib/db", replacement: stub },
      { find: "@/lib/auth/server", replacement: stub },
      { find: "@/lib/auth/middleware", replacement: stub },
      { find: "@/lib/auth/verify.server", replacement: stub },
      { find: "@/lib/auth/isolation.server", replacement: stub },
      { find: "@/lib/auth/popup.server", replacement: stub },
      { find: "@", replacement: resolve("src") },
    ],
  },
  build: {
    outDir: "apk-www",
    emptyOutDir: true,
    target: "es2018",
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      input: resolve("apk.html"),
      output: {
        format: "iife",
        name: "Spoonful",
        inlineDynamicImports: true,
        entryFileNames: "assets/spoonful.js",
        chunkFileNames: "assets/spoonful.js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
