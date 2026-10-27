// Copies the pdf.js worker into public/ so PDF uploads are parsed with code served by this app,
// not a CDN. Runs before `dev` and `build`.
import { copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const src = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
copyFileSync(src, path.join(root, "public", "pdf.worker.min.mjs"));
