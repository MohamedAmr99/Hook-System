import { useTranslation } from "react-i18next";
import { Plus, Trash2, Pencil, Filter, X, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Order, OrderStatus } from "../types/order.types";
import { useStore } from "@/shared/store/useStore";
import { useProducts, PRODUCT_QUERY_KEYS } from "@/features/products/hooks/useProducts";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import {
  onOrderCancelled,
  onOrderDeleted,
  onOrderReactivated,
} from "../services/inventory.service";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { OrderImportModal } from "../components/OrderImportModal";

const ACTIVE_STATUSES = ["Pending", "Processing", "Shipped", "Delivered"] as const;
const RETURN_STATUSES = ["Returned", "ReturnedToSeller", "ReturningToSeller", "RejectedByBuyer"] as const;

type DateFilter = "all" | "today" | "week" | "month";

function isInDateRange(dateValue: string | Date | number, range: DateFilter): boolean {
  if (range === "all") return true;
  const d = new Date(dateValue);
  const now = new Date();
  if (range === "today") {
    return d.toDateString() === now.toDateString();
  }
  if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return d >= weekAgo;
  }
  if (range === "month") {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
}

export function OrderListPage() {
  const { t } = useTranslation();
  const orders = useStore(state => state.orders);
  const updateOrderStatus = useStore(state => state.updateOrderStatus);
  const deleteOrder = useStore(state => state.deleteOrder);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();
  const [showImportModal, setShowImportModal] = React.useState(false);

  // Filters
  const [platformFilter, setPlatformFilter] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");
  const [showFilters, setShowFilters] = React.useState(false);

  const PLATFORMS = ["Amazon", "Noon", "Jumia", "Kenz", "Raneen", "B.TECH", "Own Store", "Other"];
  const ALL_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned", "ReturnedToSeller", "ReturningToSeller", "RejectedByBuyer"];

  const filteredOrders = React.useMemo(() => {
    return orders.filter(o => {
      if (platformFilter && o.platform !== platformFilter) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (!isInDateRange(o.orderDate, dateFilter)) return false;
      return true;
    });
  }, [orders, platformFilter, statusFilter, dateFilter]);

  const hasActiveFilters = platformFilter || statusFilter || dateFilter !== "all";

  const clearFilters = () => {
    setPlatformFilter("");
    setStatusFilter("");
    setDateFilter("all");
  };

  // Handles all stock sync scenarios when status changes
  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    const oldStatus = order.status;
    if (oldStatus === newStatus) return;

    updateOrderStatus(order.id, newStatus);

    if (!user) return;
    const ctx = { order, products, userId: user.uid, userDisplayName: user.displayName ?? "System" };

    const wasActive = (ACTIVE_STATUSES as readonly string[]).includes(oldStatus);
    const isNowActive = (ACTIVE_STATUSES as readonly string[]).includes(newStatus);
    const wasReturn = (RETURN_STATUSES as readonly string[]).includes(oldStatus);

    if (wasActive && newStatus === "Cancelled") {
      await onOrderCancelled(ctx);
    } else if (oldStatus === "Cancelled" && isNowActive) {
      await onOrderReactivated(ctx);
    } else if (wasReturn && isNowActive && order.returnStatus === "None") {
      await onOrderReactivated(ctx);
    }

    queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
  };

  const handleDelete = async (order: Order) => {
    if (!window.confirm(t("orders.deleteConfirm"))) return;

    deleteOrder(order.id);

    if (!user) return;
    await onOrderDeleted({
      order,
      products,
      userId: user.uid,
      userDisplayName: user.displayName ?? "System",
      wasIntact: order.returnStatus === "None",
    });
    queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
  };

  const statusColors: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    Processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    Delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    Returned: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300",
    ReturnedToSeller: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300",
    ReturningToSeller: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    RejectedByBuyer: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const platformColors: Record<string, string> = {
    Amazon: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    Noon: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    Jumia: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    Kenz: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    Raneen: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    "B.TECH": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    "Own Store": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "platformOrderId",
      header: t("orders.columns.orderId"),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium">{row.original.platformOrderId}</span>
      )
    },
    {
      accessorKey: "platform",
      header: t("orders.columns.platform"),
      cell: ({ row }) => {
        const colorClass = platformColors[row.original.platform] || platformColors["Other"];
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {row.original.platform}
          </span>
        );
      }
    },
    {
      accessorKey: "status",
      header: t("orders.columns.status"),
      cell: ({ row }) => {
        const colorClass = statusColors[row.original.status] || "";
        return (
          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 ${colorClass}`}>
            <select
              value={row.original.status}
              onChange={(e) => handleStatusChange(row.original, e.target.value as OrderStatus)}
              className="text-xs font-medium bg-transparent border-none outline-none cursor-pointer appearance-none pr-1"
            >
              {ALL_STATUSES.map(s => (
                <option key={s} value={s} className="bg-background text-foreground">{t(`orders.statuses.${s}`)}</option>
              ))}
            </select>
          </span>
        );
      }
    },
    {
      accessorKey: "items",
      header: t("orders.columns.items", "المنتجات"),
      cell: ({ row }) => {
        const items = row.original.items || [];
        return (
          <div className="space-y-0.5 max-w-[180px]">
            {items.slice(0, 2).map((item, i) => (
              <div key={i} className="text-xs text-foreground/80 truncate">
                <span className="font-semibold">{item.quantity}×</span> {item.name}
              </div>
            ))}
            {items.length > 2 && (
              <span className="text-[10px] text-muted-foreground">+{items.length - 2} {t("orders.moreItems", "أخرى")}</span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "totalRevenue",
      header: t("orders.columns.sales"),
      cell: ({ row }) => (
        <span className="font-medium">{Number(row.original.totalRevenue || 0).toFixed(2)} {t("orders.currency")}</span>
      )
    },
    {
      accessorKey: "netPayoutExpected",
      header: t("orders.columns.netProfit"),
      cell: ({ row }) => {
        const net = Number(row.original.netPayoutExpected || 0);
        return (
          <span className={`font-bold ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {net.toFixed(2)} {t("orders.currency")}
          </span>
        );
      }
    },
    {
      accessorKey: "orderDate",
      header: t("orders.columns.date"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.orderDate).toLocaleDateString()}
        </span>
      )
    },
    {
      accessorKey: "financialStatus",
      header: t("returns.columns.financialStatus", "الحالة المالية"),
      cell: ({ row }) => {
        const finStatus = row.original.financialStatus || "Unsettled";
        const isSettled = finStatus === "Settled";
        const isPending = finStatus === "PendingSettlement" || finStatus === "PartiallySettled";
        
        let colorClass = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
        if (isSettled) colorClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
        else if (isPending) colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
        else if (finStatus === "Disputed") colorClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

        return (
          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 ${colorClass}`}>
            <select
              value={finStatus}
              onChange={(e) => useStore.getState().updateOrderFinancialStatus(row.original.id, e.target.value as any)}
              className="text-xs font-medium bg-transparent border-none outline-none cursor-pointer appearance-none pr-1"
            >
              <option value="Unsettled" className="bg-background text-foreground">{t("finance.unsettled", "غير مسوى")}</option>
              <option value="PendingSettlement" className="bg-background text-foreground">قيد التسوية</option>
              <option value="PartiallySettled" className="bg-background text-foreground">مسوى جزئياً</option>
              <option value="Settled" className="bg-background text-foreground">{t("finance.settled", "مسوى")}</option>
              <option value="Disputed" className="bg-background text-foreground">{t("finance.disputed", "متنازع عليه")}</option>
            </select>
          </span>
        );
      }
    },
    {
      id: "actions",
      header: t("orders.columns.actions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Link
            to={`/orders/${row.original.id}/edit`}
            className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
            title={t("orders.editOrder", "Edit Order")}
          >
            <Pencil size={15} />
          </Link>
          <button
            onClick={() => handleDelete(row.original)}
            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title={t("orders.deleteOrder", "Delete Order")}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  // Summary stats from filtered orders
  const totalSales = filteredOrders.reduce((sum, o) => sum + Number(o.totalRevenue || 0), 0);
  const totalNet = filteredOrders.reduce((sum, o) => sum + Number(o.netPayoutExpected || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("orders.title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("orders.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1.5 border-border/80",
              (showFilters || hasActiveFilters) && "border-primary/50 bg-primary/5 text-primary"
            )}
            onClick={() => setShowFilters(v => !v)}
          >
            <Filter size={13} />
            <span>{t("common.filterStatus")}</span>
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {[platformFilter, statusFilter, dateFilter !== "all"].filter(Boolean).length}
              </span>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="h-9 gap-1.5 px-3 border-primary/20 hover:bg-primary/5 text-primary"
            onClick={() => setShowImportModal(true)}
          >
            <UploadCloud size={14} />
            <span className="hidden sm:inline">استيراد</span>
          </Button>
          <Link
            to="/orders/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("orders.newOrder")}
          </Link>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border/60 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Platform filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {t("common.filterPlatform")}
            </label>
            <select
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
              className="text-xs rounded-md border border-border/60 bg-background px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t("common.allPlatforms")}</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {t("common.filterStatus")}
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs rounded-md border border-border/60 bg-background px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t("common.allStatuses")}</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{t(`orders.statuses.${s}`)}</option>
              ))}
            </select>
          </div>

          {/* Date filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {t("common.filterDate")}
            </label>
            <div className="flex items-center gap-1">
              {(["all", "today", "week", "month"] as DateFilter[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={cn(
                    "text-xs px-2.5 py-1.5 rounded-md border transition-all",
                    dateFilter === d
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/60 hover:bg-muted"
                  )}
                >
                  {t(`common.${d === "all" ? "allTime" : d === "week" ? "thisWeek" : d === "month" ? "thisMonth" : "today"}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors mt-4"
            >
              <X size={12} />
              <span>{t("orders.clearFilters", "مسح الفلاتر")}</span>
            </button>
          )}
        </div>
      )}

      {showImportModal && (
        <OrderImportModal onClose={() => setShowImportModal(false)} />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">{t("orders.totalOrders")}</p>
          <p className="text-2xl font-bold mt-1">{filteredOrders.length}</p>
          {hasActiveFilters && orders.length !== filteredOrders.length && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{t("orders.outOf", "من أصل")} {orders.length}</p>
          )}
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">{t("orders.totalSales")}</p>
          <p className="text-2xl font-bold mt-1 text-primary">
            {totalSales.toFixed(2)} {t("orders.currency")}
          </p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">{t("orders.totalNetProfit")}</p>
          <p className={`text-2xl font-bold mt-1 ${totalNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"}`}>
            {totalNet.toFixed(2)} {t("orders.currency")}
          </p>
        </div>
      </div>

      <DataTable
        data={filteredOrders}
        columns={columns}
        searchKey="platformOrderId"
        searchPlaceholder={t("orders.search")}
      />
    </div>
  );
}
