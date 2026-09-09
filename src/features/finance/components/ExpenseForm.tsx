import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/shared/store/useStore";
import { Button } from "@/shared/components/ui/button";
import { X } from "lucide-react";
import { Expense, ExpenseCategory } from "../types/expense.types";
import { expenseRepository } from "../repositories/expense.repository";

interface Props {
  expense: Expense | null;
  onClose: () => void;
}

export function ExpenseForm({ expense, onClose }: Props) {
  const { t } = useTranslation();
  const addExpense = useStore(state => state.addExpense);
  const updateExpense = useStore(state => state.updateExpense);
  const platforms = useStore(state => state.orders).map(o => o.platform).filter((v): v is string => Boolean(v)).filter((v, i, a) => a.indexOf(v) === i); // unique platforms

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: expense?.amount || "",
    description: expense?.description || "",
    date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    category: expense?.category || "other",
    platform: expense?.platform || ""
  });

  const categories: ExpenseCategory[] = ["packaging", "shipping", "transportation", "marketing", "salaries", "other"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (expense) {
        // Update
        const updates = {
          amount: Number(formData.amount),
          description: formData.description,
          date: new Date(formData.date).getTime(),
          category: formData.category as ExpenseCategory,
          platform: formData.platform || undefined,
          updatedAt: Date.now()
        };
        await expenseRepository.update(expense.id, updates);
        updateExpense(expense.id, updates);
      } else {
        // Create
        const newExpense: Expense = {
          id: `EXP-${Date.now()}`,
          amount: Number(formData.amount),
          description: formData.description,
          date: new Date(formData.date).getTime(),
          category: formData.category as ExpenseCategory,
          platform: formData.platform || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await expenseRepository.create(newExpense);
        addExpense(newExpense);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving expense");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border shadow-lg rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h2 className="font-semibold">
            {expense ? t("expenses.form.editTitle", "Edit Expense") : t("expenses.form.createTitle", "Add Expense")}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("expenses.amount", "Amount")} *</label>
            <input 
              type="number" 
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t("expenses.date", "Date")} *</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t("expenses.description", "Description")} *</label>
            <input 
              type="text" 
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t("expenses.category", "Category")} *</label>
            <select 
              required
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {t(`expenses.categories.${cat}`, cat)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t("expenses.platform", "Platform (Optional)")}</label>
            <select 
              value={formData.platform}
              onChange={e => setFormData({ ...formData, platform: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">-- None --</option>
              {platforms.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t("expenses.form.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("expenses.form.saving", "Saving...") : t("expenses.form.save", "Save Expense")}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
