import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useProducts,
  useArchiveProductMutation,
  useDeleteProductMutation,
  useUpdateProductMutation,
} from "../hooks/useProducts";
import { ProductService } from "../services/product.service";
import { DataTable } from "@/shared/components/DataTable";
import { ProductCard } from "../components/ProductCard";
import { FilterDropdown } from "@/shared/components/FilterDropdown";
import { SearchInput } from "@/shared/components/SearchInput";
import { EmptyState } from "@/shared/components/EmptyState";
import { Button } from "@/shared/components/ui/button";
import { ProductImportModal } from "../components/ProductImportModal";
import { ColumnDef } from "@tanstack/react-table";
import type { Product } from "../types";
import {
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Trash2,
  Edit,
  Check,
  FolderPlus,
  RefreshCw,
  Loader2,
  UploadCloud,
  Image as ImageIcon,
  Copy,
  Archive,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

// ── Stock status helper ───────────────────────────────────────────────────────
function getStockInfo(product: Product) {
  const stock = product.quantity - (product.reservedQuantity ?? 0);
  if (stock <= 0)
    return { label: "نفذ المخزون", color: "bg-red-500/15 text-red-500 border-red-400/30", dot: "bg-red-500", pulse: true };
  if (stock <= product.minimumStockAlert)
    return { label: "قيد المراجعة", color: "bg-amber-500/15 text-amber-500 border-amber-400/30", dot: "bg-amber-500", pulse: true };
  return { label: "متوفر", color: "bg-emerald-500/15 text-emerald-500 border-emerald-400/30", dot: "bg-emerald-500", pulse: false };
}

// ── Platform dot ──────────────────────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, string> = {
  Active: "bg-emerald-500",
  Pending: "bg-amber-500",
  Suspended: "bg-red-500",
  Inactive: "bg-muted-foreground/30",
};
function PlatformDot({ label, status }: { label: string; status: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", PLATFORM_COLORS[status] ?? "bg-muted-foreground/30")} />
      {label}
    </span>
  );
}

// ── Thumbnail button ──────────────────────────────────────────────────────────
function ThumbButton({ product, uploading, onClick }: {
  product: Product; uploading: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      title="انقر لتغيير الصورة"
      disabled={uploading}
      onClick={onClick}
      className="relative w-12 h-12 rounded-xl border border-border/60 bg-muted overflow-hidden flex-shrink-0 group hover:ring-2 hover:ring-primary/40 transition-all"
    >
      {uploading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 size={15} className="animate-spin text-primary" />
        </div>
      ) : product.thumbnail ? (
        <>
          <img src={product.thumbnail} alt={product.productName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ImageIcon size={13} className="text-white" />
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
        </div>
      )}
    </button>
  );
}

export function ProductListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table");
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [stockStatus, setStockStatus] = React.useState<string>("");
  const [marketplaceStatus, setMarketplaceStatus] = React.useState<string>("");
  const [archived, setArchived] = React.useState<boolean>(false);

  const filters = {
    search: search || undefined,
    stockStatus: (stockStatus as any) || undefined,
    marketplaceStatus: (marketplaceStatus as any) || undefined,
    archived,
  };

  const { data: products = [], isLoading, isRefetching, refetch } = useProducts(filters);
  const { mutate: archiveProduct } = useArchiveProductMutation();
  const { mutate: deleteProduct } = useDeleteProductMutation();
  const { mutate: updateProduct } = useUpdateProductMutation();

  const handleArchive = (id: string, currentArchived: boolean) =>
    archiveProduct({ id, archived: !currentArchived });
  const handleDelete = (id: string) => deleteProduct(id);

  // ── Inline thumbnail upload ──────────────────────────────────────────────────
  const [uploadingId, setUploadingId] = React.useState<string | null>(null);
  const thumbInputRef = React.useRef<HTMLInputElement>(null);
  const uploadTargetId = React.useRef<string | null>(null);

  const triggerUpload = React.useCallback((productId: string) => {
    uploadTargetId.current = productId;
    // Reset input value so same file can be re-selected
    if (thumbInputRef.current) thumbInputRef.current.value = "";
    thumbInputRef.current?.click();
  }, []);

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const productId = uploadTargetId.current;
    if (!file || !productId) return;
    
    setUploadingId(productId);
    try {
      // Create a timeout promise to catch hanging uploads
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("Upload timeout - يرجى التحقق من اتصالك وإعدادات Firebase Storage")), 15000)
      );
      
      const url = await Promise.race([
        ProductService.uploadProductImage(file),
        timeoutPromise
      ]);
      
      updateProduct(
        { id: productId, data: { thumbnail: url } },
        {
          onSuccess: () => toast.success("تم تحديث صورة المنتج"),
          onError: () => toast.error("فشل تحديث بيانات الصورة"),
        }
      );
    } catch (err: any) {
      console.error("Image upload error:", err);
      toast.error(err?.message ?? "فشل رفع الصورة");
    } finally {
      setUploadingId(null);
      uploadTargetId.current = null;
    }
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Product>[] = React.useMemo(
    () => [
      // Select
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={table.getToggleAllRowsSelectedHandler()}
              className={cn(
                "w-4 h-4 rounded border border-border flex items-center justify-center transition-all",
                table.getIsAllRowsSelected() ? "bg-primary border-primary text-primary-foreground" : "bg-transparent",
              )}
            >
              {table.getIsAllRowsSelected() && <Check size={10} strokeWidth={3} />}
            </button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={row.getToggleSelectedHandler()}
              className={cn(
                "w-4 h-4 rounded border border-border flex items-center justify-center transition-all",
                row.getIsSelected() ? "bg-primary border-primary text-primary-foreground" : "bg-transparent",
              )}
            >
              {row.getIsSelected() && <Check size={10} strokeWidth={3} />}
            </button>
          </div>
        ),
        enableHiding: false,
        size: 40,
      },
      // Product
      {
        accessorKey: "productName",
        header: "المنتج",
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center gap-3 py-1">
              <ThumbButton
                product={product}
                uploading={uploadingId === product.id}
                onClick={() => triggerUpload(product.id)}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-[13px] font-semibold text-foreground line-clamp-1 hover:text-primary cursor-pointer transition-colors"
                  onClick={() => navigate(`/products/${product.id}/edit`)}
                >
                  {product.productName}
                </p>
                {(product.brand || product.category) && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {[product.brand, product.category].filter(Boolean).join(" • ")}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      // SKU
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="font-mono text-[11px] font-medium text-foreground/80 bg-muted/60 px-2 py-0.5 rounded-md whitespace-nowrap">
            {row.original.sku}
          </span>
        ),
        size: 120,
      },
      // Price
      {
        accessorKey: "sellingPrice",
        header: "السعر",
        cell: ({ row }) => (
          <span className="text-[13px] font-bold tabular-nums">
            {row.original.sellingPrice.toFixed(2)}
            <span className="text-[10px] font-normal text-muted-foreground mr-0.5">ج.م</span>
          </span>
        ),
        size: 100,
      },
      // Stock — quantity + "في المخزون" only, no status badge
      {
        accessorKey: "quantity",
        header: "المخزون",
        cell: ({ row }) => {
          const p = row.original;
          const stock = p.quantity - (p.reservedQuantity ?? 0);
          return (
            <div>
              <p className="text-[13px] font-bold tabular-nums">{stock}</p>
              <p className="text-[11px] text-muted-foreground">في المخزون</p>
            </div>
          );
        },
        size: 100,
      },
      // Platforms
      {
        id: "marketplaces",
        header: "المنصات",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex flex-col gap-1">
              <PlatformDot label="Amazon" status={p.amazonStatus} />
              <PlatformDot label="Noon" status={p.noonStatus} />
              <PlatformDot label="Jumia" status={p.jumiaStatus} />
            </div>
          );
        },
        size: 110,
      },
      // Status badge (standalone column)
      {
        id: "status",
        header: "الحالة",
        cell: ({ row }) => {
          const info = getStockInfo(row.original);
          return (
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap",
              info.color
            )}>
              {info.pulse ? (
                <span className="relative flex h-1.5 w-1.5">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", info.dot)} />
                  <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", info.dot)} />
                </span>
              ) : (
                <span className={cn("w-1.5 h-1.5 rounded-full", info.dot)} />
              )}
              {info.label}
            </span>
          );
        },
        size: 130,
      },
      // Actions
      {
        id: "actions",
        header: "الإجراءات",
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost" size="icon"
                title="نسخ البيانات"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  navigator.clipboard.writeText(`${product.productName}\nSKU: ${product.sku}\nالسعر: ${product.sellingPrice} ج.م`);
                  toast.success("تم النسخ");
                }}
              >
                <Copy size={13} />
              </Button>
              <Button
                variant="ghost" size="icon"
                title="تعديل"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => navigate(`/products/${product.id}/edit`)}
              >
                <Edit size={13} />
              </Button>
              <Button
                variant="ghost" size="icon"
                title="حذف"
                className="h-7 w-7 text-muted-foreground hover:text-red-500"
                onClick={() => {
                  if (confirm(`حذف "${product.productName}" نهائياً؟`)) handleDelete(product.id);
                }}
              >
                <Trash2 size={13} />
              </Button>
            </div>
          );
        },
        size: 110,
      },
    ],
    [uploadingId, triggerUpload],
  );

  // Bulk actions
  const renderBulkActions = (selectedProducts: Product[]) => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline" size="sm"
        className="h-8 gap-1.5 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500"
        onClick={() => {
          if (confirm(`أرشفة ${selectedProducts.length} منتج؟`))
            selectedProducts.forEach((p) => archiveProduct({ id: p.id, archived: true }));
        }}
      >
        <Archive size={12} />أرشفة
      </Button>
      <Button
        variant="outline" size="sm"
        className="h-8 gap-1.5 border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive"
        onClick={() => {
          if (confirm(`حذف ${selectedProducts.length} منتج نهائياً؟`))
            selectedProducts.forEach((p) => deleteProduct(p.id));
        }}
      >
        <Trash2 size={12} />حذف
      </Button>
    </div>
  );

  // Filters
  const filterElements = (
    <>
      <FilterDropdown
        label="حالة المخزون: الكل"
        value={stockStatus}
        onChange={setStockStatus}
        options={[
          { label: "الكل", value: "" },
          { label: "متوفر", value: "InStock" },
          { label: "قيد المراجعة", value: "LowStock" },
          { label: "نفذ المخزون", value: "OutOfStock" },
        ]}
      />
      <FilterDropdown
        label="منصة المنتجات: الكل"
        value={marketplaceStatus}
        onChange={setMarketplaceStatus}
        options={[
          { label: "الكل", value: "" },
          { label: "نشط", value: "Active" },
          { label: "قيد الانتظار", value: "Pending" },
          { label: "موقوف", value: "Suspended" },
          { label: "غير نشط", value: "Inactive" },
        ]}
      />
      <Button
        variant="outline" size="sm"
        className={cn(
          "h-9 px-3 border-border/80 bg-background/40 hover:bg-muted text-xs font-medium gap-1.5",
          archived && "border-primary/40 bg-primary/10 text-primary font-semibold",
        )}
        onClick={() => setArchived(!archived)}
      >
        <Archive size={13} />إظهار المؤرشف
      </Button>
    </>
  );

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            إدارة المنتجات
            {(isLoading || isRefetching) && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            إدارة كتالوج المخزون الخاص بك ومتابعة حالة المنصات.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => refetch()} title="تحديث">
            <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
          </Button>
          <div className="flex items-center border border-border/80 bg-background/50 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode("table")}
              className={cn("p-1.5 rounded-md transition-all", viewMode === "table" ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground")}
              title="جدول"
            >
              <TableIcon size={15} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-1.5 rounded-md transition-all", viewMode === "grid" ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground")}
              title="شبكي"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
          <Button
            variant="outline"
            className="h-9 gap-1.5 px-3 text-primary border-primary/30 hover:bg-primary/5"
            onClick={() => setShowImportModal(true)}
          >
            <UploadCloud size={14} />
            <span className="hidden sm:inline">استيراد</span>
          </Button>
          <Link to="/products/new">
            <Button className="h-9 gap-1.5 px-4 font-semibold">
              <Plus size={14} />إضافة منتج
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-card border border-border/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title={search || stockStatus || marketplaceStatus ? "لم يتم العثور على نتائج" : "مخزون المنتجات فارغ"}
          description={search || stockStatus || marketplaceStatus ? "جرب تعديل الفلاتر." : "قم بإضافة منتجك الأول."}
          actionLabel={search || stockStatus || marketplaceStatus ? "مسح الفلاتر" : "إضافة منتج"}
          onAction={() => {
            if (search || stockStatus || marketplaceStatus) {
              setSearch(""); setStockStatus(""); setMarketplaceStatus(""); setArchived(false);
            } else {
              navigate("/products/new");
            }
          }}
          icon={<FolderPlus size={24} />}
        />
      ) : viewMode === "table" ? (
        <>
          <DataTable
            columns={columns}
            data={products}
            searchKey="productName"
            searchPlaceholder="ابحث عن طريق اسم المنتج أو الباركود..."
            bulkActions={renderBulkActions}
            filterElements={filterElements}
          />
          <div className="text-[12px] text-muted-foreground px-1">
            إجمالي {products.length} منتج
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-card p-4 rounded-xl border border-border/55 shadow-sm">
            <SearchInput value={search} onChange={setSearch} placeholder="ابحث عن طريق اسم المنتج..." />
            <div className="flex flex-wrap items-center gap-2">{filterElements}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onArchive={handleArchive} onDelete={handleDelete} />
            ))}
          </div>
          <div className="text-[12px] text-muted-foreground px-1">
            إجمالي {products.length} منتج
          </div>
        </div>
      )}

      {showImportModal && (
        <ProductImportModal onClose={() => setShowImportModal(false)} />
      )}

      {/* Hidden file input — must be outside the table */}
      <input
        ref={thumbInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleThumbUpload}
      />
    </div>
  );
}
