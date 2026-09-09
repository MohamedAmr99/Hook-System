// @ts-nocheck
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Order, OrderStatus } from "@/features/orders/types/order.types";
import { useStore } from "@/shared/store/useStore";
import { Badge } from "@/shared/components/ui/badge";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function ReturnListPage() {
  const { t } = useTranslation();
  const orders = useStore(state => state.orders);
  const updateOrder = useStore(state => state.updateOrder);
  const { user } = useAuthStore();

  // Filter only orders that have a return status other than "None"
  const returnOrders = orders.filter(
    (o) => o.returnStatus && o.returnStatus !== "None"
  );

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
              onChange={(e) =>
                updateOrder(row.original.id, {
                  status: e.target.value as OrderStatus,
                  updatedAt: Date.now(),
                  updatedBy: user?.uid,
                })
              }
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
      accessorKey: "financialStatus",
      header: t("returns.columns.financialStatus", "الحالة المالية"),
      cell: ({ row }) => {
        const financialStatus = row.original.financialStatus;
        return (
          <select
            value={financialStatus}
            onChange={(e) =>
              updateOrder(row.original.id, {
                financialStatus: e.target.value as any,
                updatedAt: Date.now(),
                updatedBy: user?.uid,
              })
            }
            className="text-xs border rounded px-2 py-1 bg-background"
          >
            <option value="Unsettled">{t("finance.unsettled", "غير مسوى")}</option>
            <option value="Settled">{t("finance.settled", "مسوى / تم التعويض")}</option>
            <option value="Disputed">{t("finance.disputed", "متنازع عليه / مرفوض")}</option>
          </select>
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
