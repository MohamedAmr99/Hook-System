/**
 * ReturnCreateDialog
 * Opens from the "Create Return" button on a Delivered order row.
 * Creates a new document in the `returns` Firestore collection.
 * The order status stays "Delivered" — returns are a separate entity.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, RotateCcw, CheckCircle, AlertTriangle, ShieldCheck, Box, HelpCircle } from "lucide-react";
import { Order } from "@/features/orders/types/order.types";
import { ReturnCondition, ReturnStage, CaseStatus, CompensationType } from "@/features/returns/types/return.types";
import { ReturnService } from "@/features/returns/services/return.service";
import { Button } from "@/shared/components/ui/button";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/shared/lib/utils";

interface ReturnCreateDialogProps {
  order: Order;
  onClose: () => void;
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

export function ReturnCreateDialog({ order, onClose }: ReturnCreateDialogProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [condition, setCondition] = useState<ReturnCondition>("healthy");
  const [stage, setStage] = useState<ReturnStage>("requested");
  const [reason, setReason] = useState("");
  const [customerRefund, setCustomerRefund] = useState(Number(order.totalRevenue || 0));
  const [platformFeeRetained, setPlatformFeeRetained] = useState(0);
  const [shippingCostRetained, setShippingCostRetained] = useState(0);

  // Compensation / SAFE-T
  const [hasCompensation, setHasCompensation] = useState(false);
  const [caseStatus, setCaseStatus] = useState<CaseStatus>("not_opened");
  const [caseReference, setCaseReference] = useState("");
  const [compensationType, setCompensationType] = useState<CompensationType>("none");
  const [compensationAmount, setCompensationAmount] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const netLoss =
    customerRefund + platformFeeRetained + shippingCostRetained - compensationAmount;

  const productNames = order.items.map((i) => i.name).join(", ");
  const productSkus = order.items.map((i) => i.sku).filter(Boolean).join(", ");
  const totalQuantity = order.items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);

    const shouldRestock = condition === "healthy" && stage === "inspected";

    try {
      await ReturnService.createReturn({
        orderId: order.id,
        orderItemId: order.items[0]?.id || "",
        productId: order.items[0]?.productId || "",
        platformOrderId: order.platformOrderId,
        platform: order.platform,
        productName: productNames,
        sku: productSkus,
        quantity: totalQuantity,
        returnCondition: condition,
        returnStage: stage,
        reason,
        customerRefundAmount: customerRefund,
        platformFeeRetained,
        shippingCostRetained,
        caseStatus,
        caseReference,
        compensationType: compensationAmount > 0 && compensationType === "none" ? "partial" : compensationType,
        compensationAmount,
        restocked: shouldRestock,
        restockedAt: shouldRestock ? Date.now() : null,
        createdBy: user.uid,
        updatedBy: user.uid,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      setDone(true);
      navigate("/returns");
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "حدث خطأ أثناء حفظ المرتجع");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <RotateCcw size={18} className="text-amber-500" />
            <div>
              <h2 className="text-base font-bold">تسجيل مرتجع جديد</h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {order.platformOrderId} · {order.platform}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle size={40} className="text-emerald-500" />
              <p className="font-semibold text-lg">تم تسجيل المرتجع بنجاح!</p>
              <p className="text-sm text-muted-foreground">
                الطلب لا يزال بحالة "تم التوصيل". يمكنك متابعة المرتجع من قسم المرتجعات.
              </p>
              <Button onClick={onClose} className="mt-2">إغلاق</Button>
            </div>
          ) : (
            <>
              {/* Product info */}
              <div className="bg-muted/40 rounded-xl p-3 text-xs space-y-1.5 border border-border/40">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Box size={14} className="text-primary" />
                  <span>المنتجات في هذا الطلب:</span>
                </div>
                {order.items.slice(0, 3).map((item, i) => (
                  <p key={i} className="text-muted-foreground pl-4">
                    <span className="font-semibold text-foreground">{item.quantity}×</span> {item.name}{" "}
                    {item.sku && <span className="font-mono text-[11px]">({item.sku})</span>}
                  </p>
                ))}
              </div>

              {/* Condition */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">حالة المنتج المُرتجع</p>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <HelpCircle size={12} />
                    تأثير المخزون
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
                <label className="text-sm font-medium block mb-1.5">مرحلة المرتجع الحالية</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {STAGES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStage(s.value)}
                      className={cn(
                        "border rounded-lg py-1.5 px-1 text-xs font-medium text-center transition-all",
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

              {/* Compensation Toggle */}
              <div className="border border-border/60 rounded-xl p-3 bg-muted/20">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={16} />
                    إضافة مطالبة أو تعويض (SAFE-T Claim)
                  </span>
                  <input
                    type="checkbox"
                    checked={hasCompensation}
                    onChange={(e) => setHasCompensation(e.target.checked)}
                    className="rounded border-border"
                  />
                </label>

                {hasCompensation && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-border/40">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">مبلغ التعويض (ج.م)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={compensationAmount}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setCompensationAmount(val);
                          setCompensationType(val >= customerRefund ? "full" : val > 0 ? "partial" : "none");
                        }}
                        placeholder="0.00"
                        className="w-full h-8 rounded-lg border border-emerald-500/40 bg-background px-2 text-xs font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">رقم القضية / SAFE-T ID</label>
                      <input
                        type="text"
                        value={caseReference}
                        onChange={(e) => {
                          setCaseReference(e.target.value);
                          if (e.target.value && caseStatus === "not_opened") setCaseStatus("opened");
                        }}
                        placeholder="SAFE-T-..."
                        className="w-full h-8 rounded-lg border border-border/60 bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Financial fields */}
              <div className="space-y-2.5">
                <p className="text-sm font-medium">التفاصيل المالية</p>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">المبلغ المُسترد</label>
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

                {/* Net loss preview */}
                <div className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-2.5 border border-border/40">
                  <span className="text-xs text-muted-foreground">صافي الخسارة المتوقعة</span>
                  <span className={`text-sm font-bold ${netLoss > 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {netLoss.toFixed(2)} ج.م
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-sm font-medium block mb-1">سبب المرتجع</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="مثال: العميل تراجع عن الشراء / المنتج به كسر..."
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-xs">
                  <AlertTriangle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {!done && (
          <div className="flex items-center justify-between p-4 border-t border-border/60">
            <Button variant="ghost" onClick={onClose}>إلغاء</Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[140px]">
              {isSaving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري الحفظ...</>
              ) : (
                <><CheckCircle size={14} />تسجيل المرتجع</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
