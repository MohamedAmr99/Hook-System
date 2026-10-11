---
name: marketplace-settlements
description: Use when working on Amazon (or other marketplace) settlement import/parsing, order import, fee reconciliation, or the pricing calculator in this project.
---

# Marketplace settlements & imports

Files: `features/settlements/*` (`amazonParser.service.ts`, `settlement.service.ts`), `finance/components/SettlementImportModal.tsx`, `orders/components/OrderImportModal.tsx`, `shared/components/UploadZone.tsx`, `features/calculator`.

- Amazon settlement report = TSV; rows 1-7 header info, row 8 column names (lower-cased, trimmed), data from row 9. Parse by column name, never by fixed index; missing columns → 0/"" not crash.
- Strip thousands separators before `parseFloat`; handle `\r\n`; skip blank lines. Amounts may be negative (fees/refunds) — keep the sign.
- Importing must be **idempotent**: dedupe by settlement-id + order-id + sku + amount-type, so re-uploading the same file doesn't double-post.
- Import flow: parse → preview with errors → user confirms → save records → match to orders by `platformOrderId` → post `MarketplaceSettlement` / `MarketplaceFee` ledger transactions (see `double-entry-ledger`). Report unmatched rows to the user.
- Large files: parse in chunks and write with batches of ≤ 500 operations.
- Add any new parser against a real sample file placed under `src/features/settlements/__fixtures__/`; never invent column names.
- Pricing calculator: selling price must account for referral fee %, fulfillment fee, WAC (`costPrice`), and shipping; keep the formula in a pure function so it's testable.
