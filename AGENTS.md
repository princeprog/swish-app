# swish-app Agent Context

Read `../AGENTS.md` first for the full Basketball League OS product context.

This project is the Next.js App Router frontend and planning/docs app.

## Boundaries

- Do not add NestJS API files here.
- Do not add database schemas or backend service modules here unless the user explicitly changes the architecture.
- Use this app for docs, public/admin frontend UI, and future web routes.

## Important Docs

- `app/docs/page.tsx`
- `app/docs/architecture/page.tsx`
- `app/docs/diagrams/page.tsx`
- `app/docs/roadmap/page.tsx`
- `app/docs/success/page.tsx`
- `lib/project-docs.ts`
- `lib/diagram-docs.ts`

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
pnpm lint
```

## UI Guidance

- Use existing shadcn/ui components from `components/ui`.
- Keep operational product screens clean, dense, and professional.
- Prefer cards, tables, badges, tabs, sidebars, dialogs, sheets, alerts, and forms.
- Keep the product focused on the official league operations loop.
