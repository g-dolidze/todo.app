# Pro-gress v2

Daily habits, missions and progress analytics — the next version of
[Pro-gress](https://github.com/g-dolidze/pro_gress). Georgian and English, light and dark mode.

The full technical design is in **[docs/TDD.md](docs/TDD.md)**. Read it before you start.

## Project layout

| Folder            | What it is                                                                     |
| ----------------- | ------------------------------------------------------------------------------ |
| `apps/web`        | React + Vite single-page app (Tailwind, React Router, TanStack Query, i18next) |
| `apps/api`        | Express 5 REST API with Prisma 7 and PostgreSQL                                |
| `packages/shared` | Code used by both: pure domain logic (dates, schedules…) and shared types      |

## Getting started

Requirements: **Node 22.13+**, **pnpm 10** (`corepack enable`), and **Docker** (or a local PostgreSQL 16).

```bash
pnpm install
docker compose up -d                       # PostgreSQL on localhost:5432
cp apps/api/.env.example apps/api/.env
pnpm db:migrate                            # create the tables
pnpm dev                                   # API on :4000, web app on http://localhost:5173
```

The web dev server forwards `/api` to the API, so open http://localhost:5173 only.

## Everyday commands

| Command                                    | What it does                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `pnpm dev`                                 | Run API and web app with hot reload                                               |
| `pnpm lint`                                | ESLint (includes the "design tokens only, no raw colors" rule)                    |
| `pnpm format`                              | Format everything with Prettier                                                   |
| `pnpm typecheck`                           | TypeScript in every package                                                       |
| `pnpm i18n:check`                          | Fails if `ka.json` and `en.json` do not have the same keys                        |
| `pnpm test:unit`                           | Domain + web unit tests (domain coverage must stay ≥ 95 %)                        |
| `pnpm test:api`                            | API integration tests against a real database (`progress_test`)                   |
| `pnpm test:e2e`                            | Playwright: accessibility (axe), themes, languages, mobile layout, console errors |
| `pnpm --filter @progress/web test:visual`  | Screenshot tests only; add `--update-snapshots` after an intended UI change       |
| `pnpm --filter @progress/web storybook`    | Component catalogue on http://localhost:6006 (theme and language in the toolbar)  |
| `pnpm --filter @progress/web test:stories` | Every story renders and passes axe (run `build-storybook` first)                  |
| `pnpm --filter @progress/web lighthouse`   | Lighthouse on a simulated phone; fails below the TDD §14.6 budget                 |
| `pnpm db:migrate`                          | Create and apply a new migration after editing `apps/api/prisma/schema.prisma`    |

API tests use the `progress_test` database, which `docker compose` creates automatically.

## Rules (from docs/TDD.md §14.6)

- Write the test first, then the code.
- No hard-coded text: every string goes in `apps/web/src/i18n/ka.json` **and** `en.json`.
- No raw colors: use the design tokens in `apps/web/src/styles/index.css`.
- Every screen needs loading, empty and error states, and must work at 320 px in both themes.
- A PR is mergeable only when CI is green, and it includes screenshots (light + dark, mobile + desktop).
