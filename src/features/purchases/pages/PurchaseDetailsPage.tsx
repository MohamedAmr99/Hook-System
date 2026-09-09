import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "@/shared/store/useStore";
import { ArrowRight, Pencil, Printer, ArrowLeft } from "lucide-react";

export function PurchaseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const purchase = useStore(state => state.purchases.find(p => p.id === id));
  const currency = t("orders.currency");

  const isRTL = i18n.dir() === "rtl";

  if (!purchase) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">{t("purchases.notFound")}</p>
        <button onClick={() => navigate("/purchases")} className="text-primary hover:underline mt-2">
          {t("purchases.backToList")}
        </button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-800 border-gray-200",
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PartiallyReceived: "bg-blue-100 text-blue-800 border-blue-200",
    Received: "bg-green-100 text-green-800 border-green-200",
    Cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/purchases")}
            className="p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors"
          >
            {isRTL ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">تفاصيل أمر الشراء</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <span>{new Date(purchase.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[purchase.status]}`}>
                {purchase.status === "Pending" ? t(`purchases.statuses.${purchase.status}`) :
                 purchase.status === "Received" ? t(`purchases.statuses.${purchase.status}`) :
                 purchase.status === "Cancelled" ? t(`purchases.statuses.${purchase.status}`) :
                 purchase.status}
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border bg-background hover:bg-accent h-10 px-4">
            <Printer size={16} className="mr-2" />
            طباعة
          </button>
          <Link
            to={`/purchases/${purchase.id}/edit`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
          >
            <Pencil size={16} className="mr-2" />
            {t("purchases.editPurchase")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30">
              <h3 className="font-semibold text-lg">{t("purchases.form.productDetails")}</h3>
            </div>
            
            <div className="p-0">
              <table className="w-full text-sm text-left rtl:text-right">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">المنتج</th>
                    <th className="px-6 py-3 font-medium">الكمية</th>
                    <th className="px-6 py-3 font-medium">سعر الوحدة</th>
                    <th className="px-6 py-3 font-medium text-end">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {purchase.items.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                      </td>
                      <td className="px-6 py-4">{item.orderedQuantity}</td>
                      <td className="px-6 py-4">{Number(item.unitCost).toFixed(2)} {currency}</td>
                      <td className="px-6 py-4 text-end font-medium">
                        {(Number(item.orderedQuantity) * Number(item.unitCost)).toFixed(2)} {currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">معلومات المورد</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">اسم المورد</p>
                <p className="font-medium">{purchase.supplierName || "غير محدد"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الشراء</p>
                <p className="font-medium">{new Date(purchase.purchaseDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">{t("purchases.form.financials")}</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between pb-2 border-b">
                <span className="text-muted-foreground">إجمالي الأصناف</span>
                <span className="font-medium">{Number(purchase.subtotal).toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-muted-foreground">مصاريف الشحن</span>
                <span className="font-medium">{Number(purchase.shippingCost || 0).toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-muted-foreground">الضرائب</span>
                <span className="font-medium">{Number(purchase.tax || 0).toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between pb-4 border-b">
                <span className="text-muted-foreground">مصاريف أخرى (جمارك)</span>
                <span className="font-medium">{Number(purchase.otherExpenses || 0).toFixed(2)} {currency}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-base">الإجمالي الكلي</span>
                <span className="font-bold text-xl text-primary">{Number(purchase.totalCost).toFixed(2)} {currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

