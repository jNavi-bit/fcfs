/**
 * Next.js 16: no pueden coexistir middleware.ts y proxy.ts en la raíz del proyecto.
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const forbidden = [
  "middleware.ts",
  "middleware.tsx",
  "middleware.js",
  "src/middleware.ts",
  "src/middleware.tsx",
];

let bad = false;
for (const rel of forbidden) {
  const p = path.join(root, rel);
  if (fs.existsSync(p)) {
    console.error(
      `[fcfs] Elimina "${rel}". Next.js 16 solo admite proxy.ts (no middleware.ts).`,
    );
    bad = true;
  }
}
if (bad) process.exit(1);
