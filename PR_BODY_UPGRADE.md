Title: chore(lint): upgrade @typescript-eslint to support TypeScript 5.9

Summary:
- Upgrade `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` to versions compatible with TypeScript 5.9.
- Restore `typescript` devDependency to ^5.9.3 so the project can use modern TypeScript features.

Notes for reviewers / maintainers:
- After this branch is merged, run `pnpm install` (or `npm install`) in the `backend` folder to update node_modules.
- CI will run lint/tests; ensure pipeline's Node/pnpm versions are compatible.
- If any lint rules change behavior after the parser upgrade, we'll adjust rules in a follow-up.
