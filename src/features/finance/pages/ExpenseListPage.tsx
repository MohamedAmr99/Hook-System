import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/shared/store/useStore";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/DataTable";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ExpenseForm } from "../components/ExpenseForm";
import { Expense } from "../types/expense.types";

export function ExpenseListPage() {
  const { t } = useTranslation();
  const expenses = useStore(state => state.expenses) || [];
  const deleteExpense = useStore(state => state.deleteExpense);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteExpense(id);
    }
  };

  const columns = [
    {
      accessorKey: "date",
      header: t("expenses.date", "Date"),
      cell: ({ row }: any) => new Date(row.original.date).toLocaleDateString(),
    },
    {
      accessorKey: "description",
      header: t("expenses.description", "Description"),
    },
    {
      accessorKey: "category",
      header: t("expenses.category", "Category"),
      cell: ({ row }: any) => (
        <span className="px-2 py-1 bg-muted text-xs rounded-md">
          {t(`expenses.categories.${row.original.category}`, row.original.category) as string}
        </span>
      )
    },
    {
      accessorKey: "platform",
      header: t("expenses.platform", "Platform"),
      cell: ({ row }: any) => row.original.platform || "-"
    },
    {
      accessorKey: "amount",
      header: t("expenses.amount", "Amount"),
      cell: ({ row }: any) => (
        <span className="font-bold">{Number(row.original.amount).toFixed(2)}</span>
      )
    },
    {
      id: "actions",
      header: " ",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setEditingExpense(row.original);
              setIsFormOpen(true);
            }}
          >
            <Pencil size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("expenses.title", "Expenses")}</h1>
          <p className="text-muted-foreground">{t("expenses.subtitle", "Track and manage your operational expenses")}</p>
        </div>
        <Button onClick={() => { setEditingExpense(null); setIsFormOpen(true); }} className="gap-2">
          <Plus size={16} />
          {t("expenses.newExpense", "New Expense")}
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <DataTable 
          columns={columns} 
          data={expenses} 
          searchKey="description" 
        />
      </div>

      {isFormOpen && (
        <ExpenseForm 
          expense={editingExpense} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}
