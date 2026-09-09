import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { X } from "lucide-react";
import { Loan, LoanDirection } from "../types/loan.types";
import { loanRepository } from "../repositories/loan.repository";

interface Props {
  loan: Loan | null;
  onClose: () => void;
  onSaved: (loan: Loan) => void;
}

export function LoanForm({ loan, onClose, onSaved }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    personName: loan?.personName || "",
    direction: (loan?.direction || "borrowed") as LoanDirection,
    amount: loan?.amount || "",
    reason: loan?.reason || "",
    notes: loan?.notes || "",
    date: loan?.date
      ? new Date(loan.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    dueDate: loan?.dueDate
      ? new Date(loan.dueDate).toISOString().split("T")[0]
      : "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (loan) {
        // Update existing
        const updates: Partial<Loan> = {
          personName: formData.personName,
          direction: formData.direction,
          amount: Number(formData.amount),
          reason: formData.reason,
          notes: formData.notes || undefined,
          date: new Date(formData.date).getTime(),
          dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
          updatedAt: Date.now(),
        };
        await loanRepository.update(loan.id, updates);
        onSaved({ ...loan, ...updates } as Loan);
      } else {
        // Create new
        const newLoan: Loan = {
          id: `LOAN-${Date.now()}`,
          personName: formData.personName,
          direction: formData.direction,
          amount: Number(formData.amount),
          paidAmount: 0,
          reason: formData.reason,
          notes: formData.notes || undefined,
          date: new Date(formData.date).getTime(),
          dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
          status: "pending",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await loanRepository.create(newLoan);
        onSaved(newLoan);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("خطأ في حفظ السلفة");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border shadow-xl rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h2 className="font-semibold text-base">
            {loan ? "تعديل السلفة" : "إضافة سلفة جديدة"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Direction toggle */}
          <div className="space-y-1">
            <label className="text-sm font-medium">نوع السلفة *</label>
            <div className="flex rounded-md overflow-hidden border border-input">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: "borrowed" })}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  formData.direction === "borrowed"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                🔴 أنا استلفت (علينا)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: "lent" })}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  formData.direction === "lent"
                    ? "bg-green-600 text-white"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                🟢 أنا دايت (عليهم)
              </button>
            </div>
          </div>

          {/* Person name */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {formData.direction === "borrowed" ? "المُقرض (من استلفنا منه)" : "المقترض (من دايناه)"} *
            </label>
            <input
              type="text"
              required
              placeholder="اسم الشخص"
              value={formData.personName}
              onChange={e => setFormData({ ...formData, personName: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-sm font-medium">المبلغ (ج.م) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Date + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">تاريخ السلفة *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">تاريخ السداد (اختياري)</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-sm font-medium">سبب السلفة *</label>
            <input
              type="text"
              required
              placeholder="مثال: تأمين بضاعة، مصروفات..."
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium">ملاحظات (اختياري)</label>
            <textarea
              placeholder="أي تفاصيل إضافية..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
