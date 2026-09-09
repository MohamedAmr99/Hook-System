export type LoanStatus = "pending" | "partial" | "paid";
export type LoanDirection = "borrowed" | "lent"; // borrowed = أنا أخدت, lent = أنا ديت

export interface Loan {
  id: string;
  personName: string;           // اسم الشخص
  direction: LoanDirection;     // اخدنا ولا دينا
  amount: number;               // المبلغ الأصلي
  paidAmount: number;           // اللي اتدفع منه
  date: number;                 // تاريخ السلفة
  dueDate?: number;             // تاريخ السداد المتوقع (اختياري)
  reason: string;               // سبب السلفة
  notes?: string;               // ملاحظات
  status: LoanStatus;           // pending / partial / paid
  createdAt: number;
  updatedAt: number;
}

export type LoanFormData = Omit<Loan, "id" | "createdAt" | "updatedAt" | "status" | "paidAmount">;
