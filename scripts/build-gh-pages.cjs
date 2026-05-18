const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const proxy = path.join(root, "proxy.ts");
const proxyBak = path.join(root, "proxy.ghpages-build.bak.ts");

function main() {
  const argvBase = process.argv[2];
  if (
    argvBase &&
    (!process.env.NEXT_PUBLIC_BASE_PATH ||
      !String(process.env.NEXT_PUBLIC_BASE_PATH).trim())
  ) {
    process.env.NEXT_PUBLIC_BASE_PATH = argvBase.startsWith("/")
      ? argvBase
      : `/${argvBase}`;
  }

  const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").trim();
  if (!base || base === "/") {
    console.error(
      "[gh-pages] Define NEXT_PUBLIC_BASE_PATH con el nombre del repo, p. ej. NEXT_PUBLIC_BASE_PATH=/fcfs",
    );
    process.exit(1);
  }

  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    if (fs.existsSync(proxyBak)) {
      fs.renameSync(proxyBak, proxy);
      console.log("[gh-pages] proxy.ts restaurado.");
    }
  };

  process.on("exit", restore);
  process.on("SIGINT", () => {
    restore();
    process.exit(130);
  });

  if (!fs.existsSync(proxy)) {
    console.error("[gh-pages] No se encontró proxy.ts");
    process.exit(1);
  }

  fs.renameSync(proxy, proxyBak);
  console.log("[gh-pages] proxy.ts desactivado temporalmente para export estático.");

  const env = {
    ...process.env,
    STATIC_EXPORT: "1",
  };

  const r = spawnSync("pnpm", ["exec", "next", "build"], {
    cwd: root,
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });

  restore();

  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }

  const outDir = path.join(root, "out");
  if (fs.existsSync(outDir)) {
    fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
    console.log("[gh-pages] Añadido .nojekyll en", outDir);
  }

  console.log(
    "[gh-pages] Listo. Publica la carpeta `out` (contenido en la raíz del sitio de Pages).",
  );
}

main();
