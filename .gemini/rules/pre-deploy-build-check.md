# Pre-Deploy Production Build Check

Before pushing code to Git or informing the user that the code is ready for deployment (e.g. on Vercel):

1. **Mandatory Local Build Execution**:
   - Always run `npm run build` locally in the workspace.
   - Do NOT rely solely on `tsc --noEmit` or dev-server running, as Next.js production builds enforce strict ESLint fatal errors.

2. **Clean Code Hygiene**:
   - Never leave unused imports or declared variables (`@typescript-eslint/no-unused-vars`).
   - Never use `: any` type annotations; always provide typed interfaces or `Record<string, unknown>` (`@typescript-eslint/no-explicit-any`).

3. **Deploy Gate**:
   - Only push to `main` and declare deployment ready when `npm run build` exits with code 0 (`Compiled successfully` and static pages generated).
