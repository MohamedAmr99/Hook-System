import { useState } from "react";
import { Plus, Trash2, TrendingDown } from "lucide-react";
import { useStore } from "@/shared/store/useStore";
import { Button } from "@/shared/components/ui/button";
import { CollectionForm } from "../components/CollectionForm";
import type { CollectionStatus } from "../types/finance.types";

const STATUS_LABELS: Record<CollectionStatus, string> = {
  Reconciled:          "مطابق",
  PartiallyReconciled: "مطابق جزئياً",
  Difference:          "فرق / خسارة",
  Disputed:            "متنازع عليه",
};

const STATUS_COLORS: Record<CollectionStatus, string> = {
  Reconciled:          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  PartiallyReconciled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Difference:          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Disputed:            "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
};

export function CollectionListPage() {
  const collections     = useStore(state => state.collections);
  const deleteCollection = useStore(state => state.deleteCollection);
  const [showForm, setShowForm] = useState(false);

  const totalExpected  = collections.reduce((s, c) => s + c.expectedAmount, 0);
  const totalCollected = collections.reduce((s, c) => s + c.actualAmount,   0);
  const totalDiff      = collections.reduce((s, c) => s + c.difference,     0);

  return (
    <div className="space-y-6 pb-8" dir="rtl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">التحصيلات من المنصات</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            إدارة التسويات والتحويلات المالية من المنصات إلى حسابك البنكي.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus size={16} />
          {showForm ? "إلغاء" : "إضافة تحصيل يدوي"}
        </Button>
      </div>

      {/* ── KPI Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium">إجمالي المتوقع</p>
          <p className="text-2xl font-bold mt-1">{totalExpected.toFixed(2)}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">إجمالي المحصل</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{totalCollected.toFixed(2)}</p>
        </div>
        <div className={`border rounded-xl p-4 ${totalDiff !== 0 ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" : "bg-card"}`}>
          <p className={`text-xs font-medium flex items-center gap-1 ${totalDiff !== 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
            <TrendingDown size={12} /> الفروق الإجمالية
          </p>
          <p className={`text-2xl font-bold mt-1 ${totalDiff !== 0 ? "text-red-600 dark:text-red-400" : ""}`}>
            {totalDiff.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ── Add Form ── */}
      {showForm && (
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">تسجيل تحصيل جديد</h2>
          <CollectionForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20 text-right text-xs text-muted-foreground">
              <th className="p-4 font-medium">التاريخ</th>
              <th className="p-4 font-medium">المنصة</th>
              <th className="p-4 font-medium">حساب الاستلام</th>
              <th className="p-4 font-medium">المتوقع</th>
              <th className="p-4 font-medium">المحصل الفعلي</th>
              <th className="p-4 font-medium">الفرق</th>
              <th className="p-4 font-medium">الحالة</th>
              <th className="p-4 font-medium">ملاحظات</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {collections.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-10 text-center text-muted-foreground">
                  لا توجد تحصيلات مسجلة بعد.
                </td>
              </tr>
            ) : (
              collections.map(c => (
                <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-muted-foreground">
                    {new Date(c.collectionDate).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="p-4 font-medium">{c.platformId}</td>
                  <td className="p-4">{c.receivingAccountId}</td>
                  <td className="p-4 font-mono">{c.expectedAmount.toFixed(2)}</td>
                  <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {c.actualAmount.toFixed(2)}
                  </td>
                  <td className={`p-4 font-mono font-bold ${c.difference !== 0 ? "text-red-500" : "text-muted-foreground"}`}>
                    {c.difference > 0 ? "+" : ""}{c.difference.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">{c.notes || "—"}</td>
                  <td className="p-4">
                    <button
                      onClick={() => deleteCollection(c.id)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
