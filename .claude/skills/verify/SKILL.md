---
name: verify
description: Use before declaring any change in this project done — runs type check, lint and build and reports real results.
---

# Verify

Run from the repo root, in order, and report actual output (don't claim success without it):

```bash
npm run lint
npm run build      # tsc -b && vite build
```

- Files with `// @ts-nocheck` hide type errors; if you edited one, say so.
- If the change touched UI, start `npm run dev` and check the page in both `ar` (RTL) and `en`.
- If it touched money/stock, walk one example by hand (see `inventory-costing`, `double-entry-ledger`) and state the numbers.
- Pre-existing failures: separate them from ones you introduced.
