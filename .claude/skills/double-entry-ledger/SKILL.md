---
name: double-entry-ledger
description: Use when posting or changing financial transactions, ledger entries, accounts, expenses, loans, refunds or anything that moves money in this project.
---

# Double-entry ledger

Source of truth: `features/finance/services/ledger.service.ts` and `types/finance.types.ts`.

- Post only through `ledgerService.postTransaction(tx, entries)`. It rejects unbalanced entries and writes transaction + entries in one `writeBatch`. Never write `ledgerEntries` directly.
- Each entry has `debit` and `credit` (one is 0). Sum(debit) must equal Sum(credit).
- Transaction types: `OrderSale`, `OrderRefund`, `PurchasePayment`, `MarketplaceSettlement`, `MarketplaceFee`, `ExpensePayment`, `Transfer`. Add a new type to the union before using it.
- Standard order sale: Dr marketplace_receivable (net payout) + Dr marketplace_fees + Dr COGS ↔ Cr sales_revenue + Cr inventory asset. Refunds reverse it. Settlement: Dr Bank/Cash, Cr marketplace_receivable.
- Never edit or delete a posted entry; correct with a reversing transaction (`referenceId` links back).
- Account IDs are currently hardcoded strings — centralize in one constants file rather than adding more literals; look accounts up from `accounts` collection where possible.
- Floating point: round each line to 2 dp, put any rounding remainder on the largest line so the batch balances exactly.

Checklist before finishing: unbalanced case throws, reversal exists for every cancel/refund path, `referenceId` set, account balances updated in the same batch.
