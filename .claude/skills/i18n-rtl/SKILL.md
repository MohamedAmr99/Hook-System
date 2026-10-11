---
name: i18n-rtl
description: Use when adding or changing any user-facing text, labels, forms, tables or layout in this project — Arabic/English translations and RTL support.
---

# i18n & RTL

- Locales: `src/lib/i18n/locales/ar.json` and `en.json`, config in `src/lib/i18n/config.ts` (fallback `en`).
- Never hardcode UI strings. Use `const { t } = useTranslation()` and keys grouped by feature (`orders.title`, `common.save`). Add the key to BOTH files in the same change; after editing, diff the key sets of the two files and fix mismatches.
- Interpolation: `t("orders.count", { count })`; don't concatenate translated fragments.
- Direction: set `dir` on `<html>` from the active language. Use logical Tailwind utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `start-*`) instead of `ml/mr/pl/pr/left/right`. Flip directional icons (chevrons, arrows) with `rtl:rotate-180`.
- Numbers/currency/dates: format with `Intl.NumberFormat`/`Intl.DateTimeFormat` using the active locale; keep SKUs, order IDs and emails `dir="ltr"` inside RTL text.
- Tables (`DataTable`) and charts (recharts) need explicit RTL checks: column order, tooltip alignment, axis orientation.
- Zod/validation messages and toast (`sonner`) messages are user-facing too — translate them.

Done = both locales updated, page checked in `ar` (RTL) and `en`.
