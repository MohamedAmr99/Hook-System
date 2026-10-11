// @ts-nocheck
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Order, OrderStatus, ReturnCondition } from "@/features/orders/types/order.types";
import { useStore } from "@/shared/store/useStore";
import { Badge } from "@/shared/components/ui/badge";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { syncOrderStock } from "@/features/orders/services/inventory.service";
import { useProducts, PRODUCT_QUERY_KEYS } from "@/features/products/hooks/useProducts";
import { useQueryClient } from "@tanstack/react-query";

export function ReturnListPage() {
  const { t } = useTranslation();
  const orders = useStore(state => state.orders);
  const updateOrder = useStore(state => state.updateOrder);
  const { user } = useAuthStore();

  const returnOrders = orders.filter(
    (o) => o.returnStatus && o.returnStatus !== "None"
  );

  const { data: products = [] } = useProducts();
  const queryClient = useQueryClient();

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    const oldStatus = order.status;
    if (oldStatus === newStatus) return;

    updateOrder(order.id, {
      status: newStatus,
      updatedAt: Date.now(),
      updatedBy: user?.uid,
    });

    if (!user) return;

    await syncOrderStock(
      order,
      products,
      oldStatus,
      newStatus,
      user.uid,
      user.displayName || "System"
    );

    queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
  };

  const handleConditionChange = async (order: Order, newCondition: ReturnCondition) => {
    const oldCondition = order.returnCondition || "Pending";
    if (oldCondition === newCondition) return;

    updateOrder(order.id, {
      returnCondition: newCondition,
      updatedAt: Date.now(),
      updatedBy: user?.uid,
    });

    if (!user) return;

    await syncOrderStock(
      order,
      products,
      order.status,
      order.status,
      user.uid,
      user.displayName || "System",
      oldCondition,
      newCondition
    );

    queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
  };

  const statusColors: Record<string, string> = {
    Returned: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300",
    ReturnedToSeller: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300",
    ReturningToSeller: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    RejectedByBuyer: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    Delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  const RETURN_STATUSES: OrderStatus[] = [
    "Returned",
    "ReturnedToSeller",
    "ReturningToSeller",
    "RejectedByBuyer",
    "Cancelled",
    "Delivered",
  ];

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderDate",
      header: t("returns.columns.date", "التاريخ"),
      cell: ({ row }) => new Date(row.original.orderDate).toLocaleDateString("ar-EG"),
    },
    {
      accessorKey: "platformOrderId",
      header: t("returns.columns.orderId", "رقم الطلب"),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.platformOrderId}</span>,
    },
    {
      id: "item",
      header: t("returns.columns.item", "الصنف"),
      cell: ({ row }) => {
        const item = row.original.items[0];
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium line-clamp-1">{item?.name || "—"}</span>
            <span className="text-xs text-muted-foreground">{item?.sku}</span>
          </div>
        );
      }
    },
    {
      id: "quantity",
      header: t("returns.columns.quantity", "الكمية"),
      cell: ({ row }) => {
        const qty = row.original.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        return <span>{qty}</span>;
      }
    },
    {
      accessorKey: "status",
      header: t("returns.columns.status", "حالة الطلب"),
      cell: ({ row }) => {
        const status = row.original.status;
        const colorClass = statusColors[status] || "";
        return (
          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 ${colorClass}`}>
            <select
              value={status}
              onChange={(e) => handleStatusChange(row.original, e.target.value as OrderStatus)}
              className="text-xs font-medium bg-transparent border-none outline-none cursor-pointer appearance-none pr-1"
            >
              {RETURN_STATUSES.map(s => (
                <option key={s} value={s} className="bg-background text-foreground">
                  {t(`orders.statuses.${s}`, s)}
                </option>
              ))}
            </select>
          </span>
        );
      }
    },
    {
      accessorKey: "returnStatus",
      header: t("returns.columns.returnStatus", "حالة المرتجع"),
      cell: ({ row }) => {
        const returnStatus = row.original.returnStatus;
        return (
          <select
            value={returnStatus}
            onChange={(e) => {
              updateOrder(row.original.id, {
                returnStatus: e.target.value as any,
                updatedAt: Date.now(),
                updatedBy: user?.uid,
              });
            }}
            className="text-xs border rounded px-2 py-1 bg-background"
          >
            <option value="Returned">{t("orders.statuses.Returned", "مرتجع")}</option>
            <option value="ReturnedToSeller">{t("orders.statuses.ReturnedToSeller", "تم الإرجاع إلى البائع")}</option>
            <option value="ReturningToSeller">{t("orders.statuses.ReturningToSeller", "جار الإرجاع إلى البائع")}</option>
            <option value="RejectedByBuyer">{t("orders.statuses.RejectedByBuyer", "تم الرفض من قبل المشتري")}</option>
            <option value="None">{t("common.none", "لا يوجد")}</option>
          </select>
        );
      }
    },
    {
      accessorKey: "returnCondition",
      header: t("returns.columns.condition", "حالة الاستلام"),
      cell: ({ row }) => {
        const cond = row.original.returnCondition || "Pending";
        return (
          <select
            value={cond}
            onChange={(e) => handleConditionChange(row.original, e.target.value as ReturnCondition)}
            className={`text-xs border rounded px-2 py-1 bg-background font-medium ${
              cond === "Sellable" ? "text-emerald-600 border-emerald-200" :
              cond === "Damaged" || cond === "MissingParts" ? "text-red-600 border-red-200" :
              "text-amber-600 border-amber-200"
            }`}
          >
            <option value="Pending">في انتظار الاستلام</option>
            <option value="Sellable">سليم (صالح للبيع)</option>
            <option value="Damaged">تالف</option>
            <option value="MissingParts">ناقص الملحقات</option>
          </select>
        );
      }
    },
    {
      accessorKey: "financialStatus",
      header: t("returns.columns.financialStatus", "حالة التعويض"),
      cell: ({ row }) => {
        const financialStatus = row.original.financialStatus || "Unsettled";
        const order = row.original;
        // Full amount = totalRevenue or netPayoutExpected
        const fullAmount = Number(order.netPayoutExpected || order.totalRevenue || 0);

        return (
          <div className="flex flex-col gap-1 min-w-[140px]">
            <select
              value={financialStatus}
              onChange={(e) => {
                const newStatus = e.target.value;
                const updates: any = {
                  financialStatus: newStatus,
                  updatedAt: Date.now(),
                  updatedBy: user?.uid,
                };
                // If full compensation, auto-set the claim amount to full value
                if (newStatus === "Compensated") {
                  updates.returnClaimAmount = fullAmount;
                }
                // If not compensated, clear claim amount
                if (newStatus === "NotCompensated" || newStatus === "Unsettled") {
                  updates.returnClaimAmount = 0;
                }
                updateOrder(order.id, updates);
              }}
              className={`text-xs border rounded px-2 py-1 bg-background font-medium w-full ${
                financialStatus === "Compensated" ? "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20" :
                financialStatus === "NotCompensated" ? "text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20" :
                financialStatus === "PartiallyCompensated" ? "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20" :
                "text-muted-foreground border-border"
              }`}
            >
              <option value="Unsettled">غير محدد</option>
              <option value="Compensated">✅ تم التعويض بالكامل</option>
              <option value="PartiallyCompensated">⚠️ تعويض جزئي</option>
              <option value="NotCompensated">❌ لم يتم التعويض</option>
            </select>

            {/* Compensated: show full amount (read-only) */}
            {financialStatus === "Compensated" && (
              <div className="text-xs text-emerald-600 font-semibold px-1">
                المبلغ: {fullAmount.toFixed(2)} {t("orders.currency")}
              </div>
            )}

            {/* Partially Compensated: allow entering partial amount */}
            {financialStatus === "PartiallyCompensated" && (
              <input
                key={order.id + "-partial"}
                type="number"
                min="0"
                step="0.01"
                placeholder="أدخل المبلغ المعوض جزئياً"
                className="text-xs border border-amber-300 rounded px-2 py-1 bg-background mt-0.5 w-full focus:outline-none focus:ring-1 focus:ring-amber-400"
                defaultValue={order.returnClaimAmount || ""}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    updateOrder(order.id, {
                      returnClaimAmount: val,
                      updatedAt: Date.now(),
                      updatedBy: user?.uid,
                    });
                  }
                }}
              />
            )}

            {/* Not Compensated: show clear message */}
            {financialStatus === "NotCompensated" && (
              <div className="text-xs text-red-500 px-1">
                لم يُحوَّل أي مبلغ
              </div>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("returns.title", "المرتجعات")}</h1>
          <p className="text-muted-foreground">{t("returns.subtitle", "إدارة الطلبات المرتجعة ومطالبات SAFE-T.")}</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <DataTable columns={columns} data={returnOrders} searchKey="platformOrderId" />
      </div>
    </div>
  );
}
