# Frontend Development

## Recover a Stuck Next.js Compiler

Use this when the Next.js development badge stays on "Compiling...", a browser tab reports a chunk-loading problem, refreshes become unusually slow, or the development server uses excessive CPU or memory while idle.

1. Stop the current frontend development server.
2. Run:

   ```bash
   pnpm dev:fresh
   ```

3. Hard-refresh any previously open app tabs.

`pnpm dev:fresh` removes only `.next/dev`, then starts `next dev --turbopack`. It keeps production build output, source files, dependencies, and environment files intact.

Do not delete the full `.next` directory while the development server is running.
