# AGENTS.md

## Commands
- **Dev:** `bun run dev` (Next.js with Turbopack)
- **Build/typecheck:** `bun run build`
- **Lint:** `bun run lint` (fix: `bun run lint:fix`)
- **Test all:** `bun test` | **Single test:** `bun test tests/cart.test.ts`
- **Convex dev:** `bun run convex:dev`

## Architecture
Next.js 16 (App Router) + Convex (backend/DB) + Firebase (auth) + Tailwind CSS 4. Uses React 19, Zod 4, Zustand, React Compiler.
- `app/` — Pages & routes (App Router with parallel routes like `@navbar`, `@cart-animation`)
- `convex/` — Convex backend: schema, queries, mutations, actions (DB tables in `schema.ts`)
- `components/` — UI components (`ui/` for primitives, `store/`/`commerce/` for domain)
- `lib/` — Utilities & service clients (Firebase, Cohere, Paygate, CashApp, Copperx)
- `hooks/` — Custom React hooks (`use-*.ts`)
- `ctx/` — React context providers (auth, cart, toast)
- `server/` — Server-side code (paygate proxy)
- `cloudflare-workers/` — Edge workers

## Code Style
- TypeScript strict mode, path alias `@/*` from root
- Prettier: single quotes, no semis, no bracket spacing, trailing commas
- Hooks: `use-kebab-case.ts`. Components: PascalCase files in feature dirs
- Use `clsx` + `tailwind-merge` (via `lib/utils.ts` `cn()`) for className merging
- Error handling: Zod for validation. Convex for DB ops. No `any` types.
