import { useTranslation } from "react-i18next";
import { Plus, Trash2, Pencil, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Purchase } from "../types/purchase.types";
import { useStore } from "@/shared/store/useStore";
import { useProducts, PRODUCT_QUERY_KEYS } from "@/features/products/hooks/useProducts";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { ProductService } from "@/features/products/services/product.service";

export function PurchaseListPage() {
  const { t } = useTranslation();
  const purchases = useStore(state => state.purchases);
  const updatePurchaseStatus = useStore(state => state.updatePurchaseStatus);
  const deletePurchase = useStore(state => state.deletePurchase);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();

  const currency = t("orders.currency");

  // ── Status change: sync Firebase stock ──────────────────────────────────
  const handleStatusChange = async (purchase: Purchase, newStatus: Purchase["status"]) => {
    const oldStatus = purchase.status;
    if (oldStatus === newStatus) return;

    updatePurchaseStatus(purchase.id, newStatus);

    if (!user) return;

    const wasReceived = oldStatus === "Received";
    const isNowReceived = newStatus === "Received";

    for (const item of purchase.items) {
      const fp = products.find(p => p.id === item.productId);
      if (!fp) continue;

      if (!wasReceived && isNowReceived) {
        await ProductService.updateProduct(
          fp.id,
          { quantity: (fp.quantity || 0) + item.orderedQuantity },
          user.uid, user.displayName ?? "System"
        );
      } else if (wasReceived && !isNowReceived) {
        await ProductService.updateProduct(
          fp.id,
          { quantity: Math.max(0, (fp.quantity || 0) - item.orderedQuantity) },
          user.uid, user.displayName ?? "System"
        );
      }
    }

    queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
  };

  const handleDelete = async (purchase: Purchase) => {
    if (!window.confirm(t("orders.deleteConfirm"))) return;

    deletePurchase(purchase.id);

    if (user && purchase.status === "Received") {
      for (const item of purchase.items) {
        const fp = products.find(p => p.id === item.productId);
        if (fp) {
          await ProductService.updateProduct(
            fp.id,
            { quantity: Math.max(0, (fp.quantity || 0) - item.orderedQuantity) },
            user.uid, user.displayName ?? "System"
          );
        }
      }
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    }
  };

  const columns: ColumnDef<Purchase>[] = [
    {
      accessorKey: "supplierName",
      header: t("purchases.columns.supplier"),
      cell: ({ row }) => <span className="font-medium">{row.original.supplierName}</span>
    },
    {
      id: "items",
      header: t("purchases.columns.products"),
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.items.map((item, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground ml-2">x{item.orderedQuantity} @ {Number(item.unitCost).toFixed(2)} {currency}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      accessorKey: "status",
      header: t("purchases.columns.status"),
      cell: ({ row }) => {
        const statusColors: Record<string, string> = {
          Draft: "bg-gray-100 text-gray-800 border-gray-200",
          Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
          PartiallyReceived: "bg-blue-100 text-blue-800 border-blue-200",
          Received: "bg-green-100 text-green-800 border-green-200",
          Cancelled: "bg-red-100 text-red-800 border-red-200",
        };
        const colorClass = statusColors[row.original.status] || "";
        return (
          <select
            value={row.original.status}
            onChange={(e) => handleStatusChange(row.original, e.target.value as any)}
            className={`text-xs font-medium rounded-full px-3 py-1 border cursor-pointer ${colorClass} focus:outline-none`}
          >
            <option value="Draft">📝 Draft</option>
            <option value="Pending">⏳ {t("purchases.statuses.Pending")}</option>
            <option value="PartiallyReceived">📦 Partially Received</option>
            <option value="Received">✅ {t("purchases.statuses.Received")}</option>
            <option value="Cancelled">❌ {t("purchases.statuses.Cancelled")}</option>
          </select>
        );
      }
    },
    {
      accessorKey: "subtotal",
      header: t("purchases.columns.itemsCost"),
      cell: ({ row }) => <span className="font-medium">{Number(row.original.subtotal).toFixed(2)} {currency}</span>
    },
    {
      accessorKey: "shippingCost",
      header: t("purchases.columns.shipping"),
      cell: ({ row }) => <span className="text-muted-foreground">{Number(row.original.shippingCost || 0).toFixed(2)} {currency}</span>
    },
    {
      accessorKey: "totalCost",
      header: t("purchases.columns.totalCost"),
      cell: ({ row }) => <span className="font-bold text-primary">{Number(row.original.totalCost).toFixed(2)} {currency}</span>
    },
    {
      accessorKey: "purchaseDate",
      header: t("purchases.columns.date"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.purchaseDate).toLocaleDateString()}
        </span>
      )
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/purchases/${row.original.id}/view`}
            className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors"
            title="عرض التفاصيل"
          >
            <Eye size={16} />
          </Link>
          <Link
            to={`/purchases/${row.original.id}/edit`}
            className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors"
            title={t("purchases.editPurchase")}
          >
            <Pencil size={16} />
          </Link>
          <button
            onClick={() => handleDelete(row.original)}
            className="p-2 text-muted-foreground hover:text-red-600 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
            title={t("orders.deleteConfirm")}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    },
  ];

  const totalSpent = purchases
    .filter(p => p.status === "Received")
    .reduce((sum, p) => sum + Number(p.totalCost), 0);
  const received = purchases.filter(p => p.status === "Received").length;
  const pending = purchases.filter(p => p.status === "Pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("purchases.title")}</h1>
          <p className="text-muted-foreground">{t("purchases.subtitle")}</p>
        </div>
        <Link
          to="/purchases/new"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("purchases.newPurchase")}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{t("purchases.totalSpent")}</p>
          <p className="text-2xl font-bold mt-1 text-primary">{totalSpent.toFixed(2)} {currency}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{t("purchases.received")}</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{received}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{t("purchases.pending")}</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{pending}</p>
        </div>
      </div>

      <DataTable
        data={purchases}
        columns={columns}
        searchKey="supplierName"
        searchPlaceholder={t("purchases.searchSupplier")}
      />
    </div>
  );
}
