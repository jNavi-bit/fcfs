# FCFS scheduling simulator

Interactive **First-Come, First-Served (FCFS)** CPU scheduling demo built with **Next.js**, **TypeScript**, and **Tailwind CSS**. The UI supports multiple locales via **next-intl**.

## Requirements

- **Node.js** 20+
- **pnpm** 9+ (recommended; lockfile is `pnpm-lock.yaml`)

## Scripts

| Command | Description |
| -------- | ----------- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Run the app locally (with `next-intl` routing) |
| `pnpm build` | Production build |
| `pnpm run build:gh-pages` | Static export for GitHub Pages (see script / workflow) |
| `pnpm lint` | Run ESLint |

After `pnpm dev`, open the URL shown in the terminal (typically `http://localhost:3000`).

## GitHub Pages

Static export uses `NEXT_PUBLIC_BASE_PATH` (for project sites under `https://<user>.github.io/<repo>/`). The repository includes a workflow under `.github/workflows/`; in the GitHub repo, enable **Settings → Pages → Source: GitHub Actions** before the deploy step can succeed.

## Project layout (high level)

- `app/` — Next.js App Router routes and layouts
- `components/fcfs/` — Simulator UI
- `domain/scheduling/` — Scheduling logic
- `application/scheduling.ts` — Application-facing API over the domain
- `i18n/` — Routing and translations
