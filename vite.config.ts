import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import type { IncomingMessage, ServerResponse } from "http";

/**
 * Serves the pre-rendered catalogue pages (`npm run seo:prerender`) at their
 * own URLs during `vite dev` and `vite preview`.
 *
 * Vite's dev and preview servers fall back to index.html for any extensionless
 * path, so /song/tum-hi-ho-arijit-singh would boot the SPA on the home page
 * instead of serving public/song/tum-hi-ho-arijit-singh/index.html. Production
 * static hosts resolve `/path` to `/path/index.html` first (nginx `try_files
 * $uri $uri/index.html`, Netlify, Vercel, S3 + CloudFront); this middleware
 * makes local servers behave the same, so what you test is what ships.
 */
function prerenderedPages(): Plugin {
  const middleware = (root: string) => (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const url = (req.url ?? "/").split("?")[0];
    if (url === "/" || path.extname(url)) return next();

    const file = path.join(root, url, "index.html");
    if (!file.startsWith(root + path.sep)) return next(); // no traversal out of root
    if (!fs.existsSync(file)) return next();

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(fs.readFileSync(file));
  };

  return {
    name: "desiswagtunes:prerendered-pages",
    configureServer(server) {
      server.middlewares.use(middleware(path.resolve(__dirname, "public")));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(path.resolve(__dirname, "dist")));
    },
  };
}

export default defineConfig({
  plugins: [react(), prerenderedPages()],
  server: {
    port: 8080,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
