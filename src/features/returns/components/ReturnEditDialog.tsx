import React, { useState } from "react";
import { X, RotateCcw, CheckCircle, AlertTriangle, ShieldCheck, Box, HelpCircle } from "lucide-react";
import { Return, ReturnCondition, ReturnStage, CaseStatus, CompensationType } from "@/features/returns/types/return.types";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface ReturnEditDialogProps {
  returnItem: Return;
  onClose: () => void;
  onSave: (updates: Partial<Return>) => Promise<void>;
}

const CONDITIONS: { value: ReturnCondition; label: string; desc: string; color: string }[] = [
  {
    value: "healthy",
    label: "سليم",
    desc: "يعود للمخزون عند الاستلام / الفحص",
    color: "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    value: "damaged",
    label: "تالف",
    desc: "لا يعود للمخزون نهائياً",
    color: "text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20",
  },
  {
    value: "wrong_item",
    label: "منتج خاطئ",
    desc: "لا يعود لمخزون هذا المنتج",
    color: "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20",
  },
  {
    value: "missing_parts",
    label: "ناقص أجزاء",
    desc: "لا يعود للمخزون",
    color: "text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-900/20",
  },
];

const STAGES: { value: ReturnStage; label: string }[] = [
  { value: "requested", label: "مطلوب" },
  { value: "shipping_to_seller", label: "في الشحن للبائع" },
  { value: "received", label: "مُستلم" },
  { value: "inspected", label: "تم الفحص" },
  { value: "case_filed", label: "قضية مفتوحة" },
];

const CASE_STATUSES: { value: CaseStatus; label: string }[] = [
  { value: "not_opened", label: "لا يوجد" },
  { value: "opened", label: "مفتوحة" },
  { value: "under_review", label: "قيد المراجعة" },
  { value: "resolved", label: "تم الحل (مقبولة)" },
  { value: "rejected", label: "مرفوضة" },
];

const COMPENSATION_TYPES: { value: CompensationType; label: string }[] = [
  { value: "none", label: "بدون تعويض" },
  { value: "partial", label: "تعويض جزئي" },
  { value: "full", label: "تعويض كامل" },
];

export function ReturnEditDialog({ returnItem, onClose, onSave }: ReturnEditDialogProps) {
  const [condition, setCondition] = useState<ReturnCondition>(returnItem.returnCondition || "healthy");
  const [stage, setStage] = useState<ReturnStage>(returnItem.returnStage || "requested");
  const [reason, setReason] = useState(returnItem.reason || "");
  const [customerRefund, setCustomerRefund] = useState(Number(returnItem.customerRefundAmount || 0));
  const [platformFeeRetained, setPlatformFeeRetained] = useState(Number(returnItem.platformFeeRetained || 0));
  const [shippingCostRetained, setShippingCostRetained] = useState(Number(returnItem.shippingCostRetained || 0));

  // Compensation fields
  const [caseStatus, setCaseStatus] = useState<CaseStatus>(returnItem.caseStatus || "not_opened");
  const [caseReference, setCaseReference] = useState(returnItem.caseReference || "");
  const [compensationType, setCompensationType] = useState<CompensationType>(returnItem.compensationType || "none");
  const [compensationAmount, setCompensationAmount] = useState(Number(returnItem.compensationAmount || 0));

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live net loss
  const netLoss = customerRefund + platformFeeRetained + shippingCostRetained - compensationAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const isNowHealthyAndInspected = condition === "healthy" && stage === "inspected";
    const restockedUpdates = isNowHealthyAndInspected
      ? { restocked: true, restockedAt: returnItem.restockedAt || Date.now() }
      : condition !== "healthy"
      ? { restocked: false, restockedAt: null }
      : {};

    try {
      await onSave({
        returnCondition: condition,
        returnStage: stage,
        reason,
        customerRefundAmount: customerRefund,
        platformFeeRetained,
        shippingCostRetained,
        caseStatus,
        caseReference,
        compensationType,
        compensationAmount,
        ...restockedUpdates,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <RotateCcw size={20} className="text-amber-500" />
            <div>
              <h2 className="text-base font-bold">تعديل المرتجع</h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                طلب رقم: {returnItem.platformOrderId} · {returnItem.platform}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {returnItem.productName && (
            <div className="bg-muted/40 rounded-xl p-3 text-xs flex items-center gap-2">
              <Box size={16} className="text-muted-foreground shrink-0" />
              <div>
                <span className="font-semibold text-foreground">{returnItem.quantity || 1}×</span>{" "}
                <span className="text-muted-foreground">{returnItem.productName}</span>
                {returnItem.sku && <span className="font-mono text-muted-foreground mr-1">({returnItem.sku})</span>}
              </div>
            </div>
          )}

          {/* Condition */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">حالة المنتج المرتجع</label>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <HelpCircle size={12} />
                تحديد تأثير المخزون
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCondition(c.value)}
                  className={cn(
                    "border rounded-xl p-2.5 text-right transition-all flex flex-col justify-center",
                    condition === c.value
                      ? c.color + " border-2 shadow-sm font-semibold"
                      : "border-border/60 hover:bg-muted/50 text-foreground"
                  )}
                >
                  <span className="text-sm">{c.label}</span>
                  <span className="text-[10px] opacity-80 mt-0.5">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stage */}
          <div>
            <label className="text-sm font-medium block mb-1.5">مرحلة المرتجع</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStage(s.value)}
                  className={cn(
                    "border rounded-lg py-2 px-1 text-xs font-medium text-center transition-all",
                    stage === s.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/60 hover:bg-muted/50"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compensation Section (SAFE-T / Claim) */}
          <div className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={16} />
              <span>التعويض والمطالبات (SAFE-T / Platform Claim)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">حالة القضية / المطالبة</label>
                <select
                  value={caseStatus}
                  onChange={(e) => setCaseStatus(e.target.value as CaseStatus)}
                  className="w-full h-9 rounded-lg border border-border/60 bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {CASE_STATUSES.map((cs) => (
                    <option key={cs.value} value={cs.value}>
                      {cs.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">رقم مرجع القضية (Case ID / SAFE-T)</label>
                <input
                  type="text"
                  value={caseReference}
                  onChange={(e) => setCaseReference(e.target.value)}
                  placeholder="مثال: SAFE-T-847291"
                  className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">نوع التعويض</label>
                <select
                  value={compensationType}
                  onChange={(e) => setCompensationType(e.target.value as CompensationType)}
                  className="w-full h-9 rounded-lg border border-border/60 bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {COMPENSATION_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>
                      {ct.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">مبلغ التعويض المستلم (ج.م)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={compensationAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setCompensationAmount(val);
                    if (val > 0 && compensationType === "none") {
                      setCompensationType("partial");
                    }
                  }}
                  className="w-full h-9 rounded-lg border border-emerald-500/40 bg-background px-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          </div>

          {/* Financial details */}
          <div className="space-y-3">
            <p className="text-sm font-medium">التفاصيل المالية لطلب الإرجاع</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">مُسترد للعميل</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={customerRefund}
                  onChange={(e) => setCustomerRefund(Number(e.target.value) || 0)}
                  className="w-full h-9 rounded-lg border border-border/60 bg-background px-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">عمولة محتجزة</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={platformFeeRetained}
                  onChange={(e) => setPlatformFeeRetained(Number(e.target.value) || 0)}
                  className="w-full h-9 rounded-lg border border-border/60 bg-background px-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">شحن محتجز</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={shippingCostRetained}
                  onChange={(e) => setShippingCostRetained(Number(e.target.value) || 0)}
                  className="w-full h-9 rounded-lg border border-border/60 bg-background px-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Net loss indicator */}
            <div className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-3">
              <div>
                <span className="text-sm text-muted-foreground">صافي الخسارة بعد التعويض</span>
                <p className="text-[11px] text-muted-foreground">
                  (المسترد + العمولات المحتجزة - مبلغ التعويض)
                </p>
              </div>
              <span className={`text-base font-bold ${netLoss > 0 ? "text-red-500" : "text-emerald-500"}`}>
                {netLoss.toFixed(2)} ج.م
              </span>
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="text-sm font-medium block mb-1.5">سبب أو ملاحظات المرتجع</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="أي ملاحظات حول المرتجع أو حالة الاستلام..."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-xs">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2 min-w-[130px]">
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  حفظ التعديلات
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
