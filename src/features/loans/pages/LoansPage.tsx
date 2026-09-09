import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Plus,
  Pencil,
  Trash2,
  BadgeDollarSign,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { Loan, LoanStatus } from "../types/loan.types";
import { loanRepository } from "../repositories/loan.repository";
import { LoanForm } from "../components/LoanForm";
import { LoanPaymentForm } from "../components/LoanPaymentForm";

const STATUS_LABELS: Record<LoanStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "لم يُسدَّد",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: <AlertCircle size={12} />,
  },
  partial: {
    label: "جزئي",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: <Clock size={12} />,
  },
  paid: {
    label: "مسدَّد",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: <CheckCircle2 size={12} />,
  },
};

export function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);
  const [filter, setFilter] = useState<"all" | "borrowed" | "lent">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | LoanStatus>("all");

  // Load loans from Firebase
  useEffect(() => {
    loanRepository
      .getAll()
      .then(setLoans)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaved = (savedLoan: Loan) => {
    setLoans(prev => {
      const exists = prev.find(l => l.id === savedLoan.id);
      if (exists) return prev.map(l => (l.id === savedLoan.id ? savedLoan : l));
      return [savedLoan, ...prev];
    });
  };

  const handleDelete = async (loan: Loan) => {
    if (!window.confirm(`هل أنت متأكد من حذف سلفة "${loan.personName}"؟`)) return;
    try {
      await loanRepository.delete(loan.id);
      setLoans(prev => prev.filter(l => l.id !== loan.id));
    } catch {
      alert("خطأ في الحذف");
    }
  };

  // Filtered list
  const filtered = loans.filter(l => {
    const dirMatch = filter === "all" || l.direction === filter;
    const statusMatch = statusFilter === "all" || l.status === statusFilter;
    return dirMatch && statusMatch;
  });

  // Summary stats
  const totalBorrowed = loans
    .filter(l => l.direction === "borrowed")
    .reduce((s, l) => s + (l.amount - l.paidAmount), 0);
  const totalLent = loans
    .filter(l => l.direction === "lent")
    .reduce((s, l) => s + (l.amount - l.paidAmount), 0);
  const pendingCount = loans.filter(l => l.status !== "paid").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BadgeDollarSign className="text-primary" size={26} />
            السلف والديون
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            تتبع السلف التي أخذتها أو أعطيتها
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingLoan(null);
            setIsFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus size={16} />
          إضافة سلفة
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-4 shadow-sm">
          <div className="h-11 w-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">علينا (استلفنا)</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {totalBorrowed.toFixed(2)} ج.م
            </p>
            <p className="text-xs text-muted-foreground">متبقي للسداد</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 flex items-center gap-4 shadow-sm">
          <div className="h-11 w-11 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">عليهم (ديناهم)</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {totalLent.toFixed(2)} ج.م
            </p>
            <p className="text-xs text-muted-foreground">متبقي للاسترداد</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 flex items-center gap-4 shadow-sm">
          <div className="h-11 w-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Wallet className="text-amber-600 dark:text-amber-400" size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">سلف قائمة</p>
            <p className="text-xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">لم تُسدَّد بعد</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Direction filter */}
        <div className="flex rounded-lg border overflow-hidden text-sm">
          {(["all", "borrowed", "lent"] as const).map(d => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`px-3 py-1.5 transition-colors ${
                filter === d
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {d === "all" ? "الكل" : d === "borrowed" ? "🔴 علينا" : "🟢 عليهم"}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex rounded-lg border overflow-hidden text-sm">
          {(["all", "pending", "partial", "paid"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {s === "all"
                ? "كل الحالات"
                : s === "pending"
                ? "لم يُسدَّد"
                : s === "partial"
                ? "جزئي"
                : "مسدَّد"}
            </button>
          ))}
        </div>
      </div>

      {/* Loans List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-xl bg-card">
          <BadgeDollarSign size={40} className="mb-3 opacity-30" />
          <p className="text-sm">لا توجد سلف مسجلة</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1"
            onClick={() => {
              setEditingLoan(null);
              setIsFormOpen(true);
            }}
          >
            <Plus size={14} />
            إضافة أول سلفة
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(loan => {
            const remaining = loan.amount - loan.paidAmount;
            const progress = (loan.paidAmount / loan.amount) * 100;
            const statusInfo = STATUS_LABELS[loan.status];
            const isBorrowed = loan.direction === "borrowed";

            return (
              <div
                key={loan.id}
                className={`rounded-xl border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md`}
              >
                {/* Color stripe */}
                <div
                  className={`h-1 w-full ${isBorrowed ? "bg-red-500" : "bg-green-500"}`}
                />

                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          isBorrowed
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {loan.personName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{loan.personName}</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isBorrowed
                                ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                                : "bg-green-50 text-green-600 dark:bg-green-900/20"
                            }`}
                          >
                            {isBorrowed ? "🔴 علينا" : "🟢 عليهم"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{loan.reason}</p>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>📅 {new Date(loan.date).toLocaleDateString("ar-EG")}</span>
                          {loan.dueDate && (
                            <span>
                              ⏰ سداد:{" "}
                              {new Date(loan.dueDate).toLocaleDateString("ar-EG")}
                            </span>
                          )}
                        </div>
                        {loan.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            💬 {loan.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: amounts + actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold">{loan.amount.toFixed(2)} ج.م</p>
                        {loan.status !== "paid" && (
                          <p className="text-xs text-muted-foreground">
                            متبقي:{" "}
                            <span className="text-destructive font-medium">
                              {remaining.toFixed(2)} ج.م
                            </span>
                          </p>
                        )}
                        {loan.paidAmount > 0 && (
                          <p className="text-xs text-green-600">
                            مدفوع: {loan.paidAmount.toFixed(2)} ج.م
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {loan.status !== "paid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => setPayingLoan(loan)}
                          >
                            <CheckCircle2 size={13} />
                            دفعة
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setEditingLoan(loan);
                            setIsFormOpen(true);
                          }}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(loan)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {loan.amount > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>نسبة السداد</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            loan.status === "paid" ? "bg-green-500" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isFormOpen && (
        <LoanForm
          loan={editingLoan}
          onClose={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
      {payingLoan && (
        <LoanPaymentForm
          loan={payingLoan}
          onClose={() => setPayingLoan(null)}
          onSaved={updated => {
            handleSaved(updated);
            setPayingLoan(null);
          }}
        />
      )}
    </div>
  );
}
