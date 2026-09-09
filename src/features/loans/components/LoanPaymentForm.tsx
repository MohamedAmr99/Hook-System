import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { X } from "lucide-react";
import { Loan } from "../types/loan.types";
import { loanRepository } from "../repositories/loan.repository";

interface Props {
  loan: Loan;
  onClose: () => void;
  onSaved: (loan: Loan) => void;
}

export function LoanPaymentForm({ loan, onClose, onSaved }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [payAmount, setPayAmount] = useState("");

  const remaining = loan.amount - loan.paidAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pay = Number(payAmount);
    if (pay <= 0 || pay > remaining) {
      alert(`أدخل مبلغ صحيح (الحد الأقصى ${remaining.toFixed(2)} ج.م)`);
      return;
    }

    setIsLoading(true);
    try {
      const newPaid = loan.paidAmount + pay;
      const newStatus = newPaid >= loan.amount ? "paid" : "partial";
      const updates: Partial<Loan> = {
        paidAmount: newPaid,
        status: newStatus,
        updatedAt: Date.now(),
      };
      await loanRepository.update(loan.id, updates);
      onSaved({ ...loan, ...updates } as Loan);
      onClose();
    } catch (err) {
      console.error(err);
      alert("خطأ في تسجيل الدفعة");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card border shadow-xl rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h2 className="font-semibold text-base">تسجيل دفعة سداد</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Loan summary */}
          <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">الشخص:</span>
              <span className="font-medium">{loan.personName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">إجمالي السلفة:</span>
              <span className="font-medium">{loan.amount.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المدفوع:</span>
              <span className="font-medium text-green-600">{loan.paidAmount.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between border-t pt-1 mt-1">
              <span className="text-muted-foreground">المتبقي:</span>
              <span className="font-bold text-destructive">{remaining.toFixed(2)} ج.م</span>
            </div>
          </div>

          {/* Pay amount */}
          <div className="space-y-1">
            <label className="text-sm font-medium">المبلغ المدفوع الآن *</label>
            <input
              type="number"
              required
              min="0.01"
              max={remaining}
              step="0.01"
              placeholder="0.00"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">الحد الأقصى: {remaining.toFixed(2)} ج.م</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : "تسجيل الدفعة"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
