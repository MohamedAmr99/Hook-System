import { useState, useMemo } from "react";
import {
  Calculator,
  TrendingUp,
  Package,
  DollarSign,
  Percent,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
} from "lucide-react";

interface CalcInputs {
  costPrice: string;           // تكلفة المنتج
  commissionPct: string;       // عمولة المنصة %
  shippingCost: string;        // تكلفة الشحن
  vatPct: string;              // ضريبة القيمة المضافة %
  advertisingPct: string;      // نسبة إعلانات %
  desiredMarginPct: string;    // هامش الربح المطلوب %
  sellingPrice: string;        // سعر البيع (للحساب العكسي)
  mode: "suggest" | "analyze"; // وضع الحاسبة
}

const DEFAULT_INPUTS: CalcInputs = {
  costPrice: "",
  commissionPct: "15",
  shippingCost: "0",
  vatPct: "0",
  advertisingPct: "5",
  desiredMarginPct: "20",
  sellingPrice: "",
  mode: "suggest",
};

function InputField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium flex items-center gap-1">
        {label}
        {hint && (
          <span title={hint} className="cursor-help">
            <Info size={12} className="text-muted-foreground" />
          </span>
        )}
      </label>
      <div className="relative flex">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "0"}
          className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10"
        />
        {suffix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  highlight,
  positive,
  negative,
  large,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
  negative?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        highlight ? "border-t border-border mt-1 pt-3" : ""
      }`}
    >
      <span className={`text-sm ${highlight ? "font-semibold" : "text-muted-foreground"}`}>
        {label}
      </span>
      <span
        className={`font-bold text-sm ${large ? "text-base" : ""} ${
          positive
            ? "text-green-600 dark:text-green-400"
            : negative
            ? "text-red-600 dark:text-red-400"
            : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

const PRESET_COMMISSIONS = [
  { label: "Amazon", value: "15" },
  { label: "Noon", value: "12" },
  { label: "Jumia", value: "10" },
  { label: "بدون عمولة", value: "0" },
];

export function PricingCalculatorPage() {
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULT_INPUTS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (key: keyof CalcInputs) => (val: string) =>
    setInputs(prev => ({ ...prev, [key]: val }));

  const n = (v: string) => Math.max(0, parseFloat(v) || 0);

  // ── Calculations ──────────────────────────────────────────────
  const calc = useMemo(() => {
    const cost = n(inputs.costPrice);
    const commission = n(inputs.commissionPct) / 100;
    const shipping = n(inputs.shippingCost);
    const vat = n(inputs.vatPct) / 100;
    const ads = n(inputs.advertisingPct) / 100;
    const margin = n(inputs.desiredMarginPct) / 100;
    const selling = n(inputs.sellingPrice);

    if (inputs.mode === "suggest") {
      // ── Mode 1: Suggest selling price ──────────────────────────
      // selling = cost + shipping + (selling * commission) + (selling * ads) + (selling * vat) + (selling * margin)
      // selling * (1 - commission - ads - vat - margin) = cost + shipping
      const divisor = 1 - commission - ads - vat - margin;
      if (divisor <= 0 || cost === 0) {
        return null;
      }
      const suggestedPrice = (cost + shipping) / divisor;
      const commissionAmount = suggestedPrice * commission;
      const adsAmount = suggestedPrice * ads;
      const vatAmount = suggestedPrice * vat;
      const totalCosts = cost + shipping + commissionAmount + adsAmount + vatAmount;
      const netProfit = suggestedPrice - totalCosts;
      const actualMargin = suggestedPrice > 0 ? (netProfit / suggestedPrice) * 100 : 0;
      const roiPct = cost > 0 ? (netProfit / cost) * 100 : 0;

      return {
        suggestedPrice,
        commissionAmount,
        adsAmount,
        vatAmount,
        totalCosts,
        netProfit,
        actualMargin,
        roiPct,
        breakEvenPrice: (cost + shipping) / (1 - commission - ads - vat),
      };
    } else {
      // ── Mode 2: Analyze existing selling price ──────────────────
      if (selling === 0 || cost === 0) return null;
      const commissionAmount = selling * commission;
      const adsAmount = selling * ads;
      const vatAmount = selling * vat;
      const totalCosts = cost + shipping + commissionAmount + adsAmount + vatAmount;
      const netProfit = selling - totalCosts;
      const actualMargin = (netProfit / selling) * 100;
      const roiPct = (netProfit / cost) * 100;
      const breakEvenPrice = (cost + shipping) / (1 - commission - ads - vat);

      return {
        suggestedPrice: selling,
        commissionAmount,
        adsAmount,
        vatAmount,
        totalCosts,
        netProfit,
        actualMargin,
        roiPct,
        breakEvenPrice,
      };
    }
  }, [inputs]);

  const fmt = (v: number) => `${v.toFixed(2)} ج.م`;
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;

  const reset = () => setInputs(DEFAULT_INPUTS);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="text-primary" size={26} />
            حاسبة تسعير المنتجات
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            احسب سعر البيع المثالي أو حلل ربحية منتج موجود
          </p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={14} />
          إعادة تعيين
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-xl border overflow-hidden shadow-sm">
        <button
          onClick={() => setInputs(p => ({ ...p, mode: "suggest" }))}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
            inputs.mode === "suggest"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <TrendingUp size={16} />
          اقتراح سعر البيع
        </button>
        <button
          onClick={() => setInputs(p => ({ ...p, mode: "analyze" }))}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
            inputs.mode === "analyze"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <DollarSign size={16} />
          تحليل سعر موجود
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Inputs ── */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Package size={15} />
              بيانات المنتج
            </h2>

            <InputField
              label="تكلفة المنتج (سعر الشراء) *"
              value={inputs.costPrice}
              onChange={set("costPrice")}
              placeholder="0.00"
              suffix="ج.م"
            />

            {inputs.mode === "analyze" && (
              <InputField
                label="سعر البيع الحالي *"
                value={inputs.sellingPrice}
                onChange={set("sellingPrice")}
                placeholder="0.00"
                suffix="ج.م"
              />
            )}

            {inputs.mode === "suggest" && (
              <InputField
                label="هامش الربح المطلوب"
                value={inputs.desiredMarginPct}
                onChange={set("desiredMarginPct")}
                placeholder="20"
                suffix="%"
                hint="النسبة من سعر البيع التي تريد كسبها"
              />
            )}

            <InputField
              label="تكلفة الشحن"
              value={inputs.shippingCost}
              onChange={set("shippingCost")}
              placeholder="0.00"
              suffix="ج.م"
            />
          </div>

          {/* Commission */}
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Percent size={15} />
              التكاليف النسبية
            </h2>

            <div className="space-y-1">
              <label className="text-sm font-medium">عمولة المنصة</label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {PRESET_COMMISSIONS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => setInputs(prev => ({ ...prev, commissionPct: p.value }))}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      inputs.commissionPct === p.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {p.label} {p.value !== "0" ? `(${p.value}%)` : ""}
                  </button>
                ))}
              </div>
              <InputField
                label=""
                value={inputs.commissionPct}
                onChange={set("commissionPct")}
                placeholder="15"
                suffix="%"
              />
            </div>

            <InputField
              label="نسبة الإعلانات"
              value={inputs.advertisingPct}
              onChange={set("advertisingPct")}
              placeholder="5"
              suffix="%"
              hint="مثال: إعلانات Sponsored على Amazon"
            />

            {/* Advanced */}
            <button
              onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showAdvanced ? "إخفاء الخيارات المتقدمة" : "خيارات متقدمة (VAT)"}
            </button>

            {showAdvanced && (
              <InputField
                label="ضريبة القيمة المضافة (VAT)"
                value={inputs.vatPct}
                onChange={set("vatPct")}
                placeholder="0"
                suffix="%"
                hint="إذا كانت تُحتسب على الإيراد"
              />
            )}
          </div>
        </div>

        {/* ── Results ── */}
        <div className="space-y-4">
          {!calc ? (
            <div className="rounded-xl border bg-card p-8 shadow-sm flex flex-col items-center justify-center text-center text-muted-foreground min-h-[300px]">
              <Calculator size={36} className="opacity-20 mb-3" />
              <p className="text-sm">أدخل تكلفة المنتج لبدء الحساب</p>
            </div>
          ) : (
            <>
              {/* Main result */}
              <div
                className={`rounded-xl border p-5 shadow-sm text-center ${
                  inputs.mode === "suggest"
                    ? "bg-primary/5 border-primary/30"
                    : calc.netProfit >= 0
                    ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                    : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
                }`}
              >
                {inputs.mode === "suggest" ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-1">سعر البيع المقترح</p>
                    <p className="text-4xl font-bold text-primary">
                      {fmt(calc.suggestedPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      لتحقيق هامش ربح {fmtPct(n(inputs.desiredMarginPct))}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-1">صافي الربح</p>
                    <p
                      className={`text-4xl font-bold ${
                        calc.netProfit >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {fmt(calc.netProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {calc.netProfit >= 0 ? "✅ مربح" : "❌ خسارة"}
                    </p>
                  </>
                )}
              </div>

              {/* Breakdown */}
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <TrendingUp size={15} />
                  تفصيل الأرقام
                </h3>

                <div className="divide-y divide-border/50">
                  <ResultRow
                    label="سعر البيع"
                    value={fmt(calc.suggestedPrice)}
                  />
                  <ResultRow
                    label="(-) تكلفة المنتج"
                    value={fmt(n(inputs.costPrice))}
                    negative
                  />
                  {n(inputs.shippingCost) > 0 && (
                    <ResultRow
                      label="(-) تكلفة الشحن"
                      value={fmt(n(inputs.shippingCost))}
                      negative
                    />
                  )}
                  <ResultRow
                    label={`(-) عمولة المنصة (${inputs.commissionPct}%)`}
                    value={fmt(calc.commissionAmount)}
                    negative
                  />
                  {calc.adsAmount > 0 && (
                    <ResultRow
                      label={`(-) إعلانات (${inputs.advertisingPct}%)`}
                      value={fmt(calc.adsAmount)}
                      negative
                    />
                  )}
                  {calc.vatAmount > 0 && (
                    <ResultRow
                      label={`(-) VAT (${inputs.vatPct}%)`}
                      value={fmt(calc.vatAmount)}
                      negative
                    />
                  )}
                  <ResultRow
                    label="= صافي الربح"
                    value={fmt(calc.netProfit)}
                    positive={calc.netProfit >= 0}
                    negative={calc.netProfit < 0}
                    highlight
                    large
                  />
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border bg-card p-3 text-center shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">هامش الربح</p>
                  <p
                    className={`text-lg font-bold ${
                      calc.actualMargin >= 15
                        ? "text-green-600 dark:text-green-400"
                        : calc.actualMargin >= 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {fmtPct(calc.actualMargin)}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-3 text-center shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">العائد على التكلفة</p>
                  <p
                    className={`text-lg font-bold ${
                      calc.roiPct >= 20
                        ? "text-green-600 dark:text-green-400"
                        : calc.roiPct >= 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {fmtPct(calc.roiPct)}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-3 text-center shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">نقطة التعادل</p>
                  <p className="text-sm font-bold">{fmt(calc.breakEvenPrice)}</p>
                </div>
              </div>

              {/* Tips */}
              {calc.actualMargin < 10 && calc.netProfit >= 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
                  ⚠️ <strong>هامش ربح منخفض.</strong> فكر في تقليل التكاليف أو رفع سعر البيع.
                </div>
              )}
              {calc.netProfit < 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-300">
                  ❌ <strong>السعر الحالي يؤدي إلى خسارة!</strong> الحد الأدنى للربح هو{" "}
                  <strong>{fmt(calc.breakEvenPrice)}</strong>.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
