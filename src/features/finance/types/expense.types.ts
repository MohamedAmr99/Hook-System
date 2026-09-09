export type ExpenseCategory = "packaging" | "shipping" | "transportation" | "marketing" | "salaries" | "other";

export interface Expense {
  id: string;
  amount: number;
  date: number; // timestamp
  description: string;
  category: ExpenseCategory;
  platform?: string; // Optional if expense is tied to a specific platform
  createdAt: number;
  updatedAt: number;
}

export type ExpenseFormData = Omit<Expense, "id" | "createdAt" | "updatedAt">;
