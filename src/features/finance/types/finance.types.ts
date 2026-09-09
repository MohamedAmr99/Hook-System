export type AccountType = "Cash" | "Bank" | "MarketplaceBalance" | "Payable" | "Receivable" | "Expense" | "Revenue" | "COGS" | "Equity";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number; // Current calculated balance
  description?: string;
  isSystem: boolean; // Cannot be deleted if true
  createdAt: number;
  updatedAt: number;
}

export type TransactionType = 
  | "OrderSale"
  | "OrderRefund"
  | "PurchasePayment"
  | "MarketplaceSettlement"
  | "MarketplaceFee"
  | "ExpensePayment"
  | "Transfer";

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  amount: number; // Positive for Debit, Negative for Credit (or standard debit/credit columns)
  debit: number;
  credit: number;
  createdAt: number;
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  referenceId?: string; // Order ID, Settlement ID, Purchase ID
  date: number;
  description: string;
  
  // Double entry strict validation
  totalDebit: number;
  totalCredit: number; // Must equal totalDebit
  
  status: "Draft" | "Posted" | "Voided";
  
  createdAt: number;
  createdBy: string;
}

export type CollectionStatus = "Reconciled" | "PartiallyReconciled" | "Difference" | "Disputed";

export interface Collection {
  id: string;
  platformId: string;
  collectionDate: number;
  expectedAmount: number; // For the period/orders
  actualAmount: number;   // What actually hit the bank
  difference: number;     // expected - actual
  status: CollectionStatus;
  
  reference?: string;
  externalReference?: string;
  externalSettlementId?: string; // Idempotency key
  importBatchId?: string;        // Idempotency key
  
  receivingAccountId: string; // e.g. "Bank", "Cash", "Wallet"
  
  settlementPeriodStart?: number;
  settlementPeriodEnd?: number;
  ordersCount?: number;
  
  notes?: string;
  
  // Audit
  createdBy: string;
  createdAt: number;
  updatedBy?: string;
  updatedAt?: number;
}
