import { Link } from "react-router-dom";
import { Edit, Archive, Trash2 } from "lucide-react";
import { ProductStatusBadge } from "./ProductStatusBadge";
import type { Product } from "../types";
import { cn } from "@/shared/lib/utils";

interface ProductCardProps {
  product: Product;
  onArchive?: (id: string, archived: boolean) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function ProductCard({
  product,
  onArchive,
  onDelete,
  className,
}: ProductCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20",
        product.archived && "opacity-60",
        className,
      )}
    >
      {/* Media Gallery / Thumbnail */}
      <div className="aspect-[4/3] w-full bg-muted overflow-hidden relative border-b border-border/40">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/40">
            <span className="text-xs font-semibold uppercase tracking-wider">
              لا توجد صورة
            </span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <ProductStatusBadge
            type="stock"
            status=""
            quantity={product.quantity}
            reserved={product.reservedQuantity}
            minAlert={product.minimumStockAlert}
          />
        </div>

        {/* Quick Actions Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 z-20">
          <button
            onClick={(e) => {
              e.preventDefault();
              const text = `${product.productName}\n\n${product.description || ""}\n\nالسعر: ${product.sellingPrice} ج.م\nSKU: ${product.sku}`;
              navigator.clipboard.writeText(text);
            }}
            className="w-9 h-9 rounded-full bg-background/90 text-foreground hover:scale-110 hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center shadow-md"
            title="نسخ بيانات المنتج"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
          <Link
            to={`/products/${product.id}/edit`}
            className="w-9 h-9 rounded-full bg-background/90 text-foreground hover:scale-110 hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center shadow-md"
            title="تعديل المنتج"
          >
            <Edit size={16} />
          </Link>
          {onArchive && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onArchive(product.id, !product.archived);
              }}
              className="w-9 h-9 rounded-full bg-background/90 text-foreground hover:scale-110 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center shadow-md"
              title={product.archived ? "استعادة المنتج" : "أرشفة المنتج"}
            >
              <Archive size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (
                  confirm(
                    `هل أنت متأكد من حذف ${product.productName} نهائياً؟`,
                  )
                ) {
                  onDelete(product.id);
                }
              }}
              className="w-9 h-9 rounded-full bg-background/90 text-foreground hover:scale-110 hover:bg-destructive hover:text-white transition-all flex items-center justify-center shadow-md"
              title="حذف المنتج"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Info Content */}
      <div className="p-4 flex-1 flex flex-col space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
              {product.brand} • {product.category}
            </span>
            <span className="text-xs font-semibold text-muted-foreground/80 select-all font-mono">
              {product.sku}
            </span>
          </div>
          <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.productName}
          </h4>
        </div>

        {/* Pricing Summary */}
        <div className="flex justify-between items-baseline border-t border-border/40 pt-2.5 mt-auto">
          <div className="space-y-0.5">
              <span className="text-foreground font-bold">
                {product.sellingPrice.toFixed(2)} ج.م
              </span>
          </div>
        </div>

        {/* Marketplace Sync Indicators */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border/30 text-[10px] font-semibold text-muted-foreground">
          <span className="mr-auto">المزامنة:</span>
          {product.amazonStatus === "Active" && (
            <span
              className="px-1.5 py-0.5 bg-orange-500/10 text-orange-500 rounded border border-orange-500/10"
              title="Amazon Active"
            >
              AMZ
            </span>
          )}
          {product.noonStatus === "Active" && (
            <span
              className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 rounded border border-yellow-500/10"
              title="Noon Active"
            >
              NON
            </span>
          )}
          {product.jumiaStatus === "Active" && (
            <span
              className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded border border-blue-500/10"
              title="Jumia Active"
            >
              JUM
            </span>
          )}
          {product.amazonStatus !== "Active" &&
            product.noonStatus !== "Active" &&
            product.jumiaStatus !== "Active" && (
              <span className="text-muted-foreground/60 italic font-normal">
                لا يوجد
              </span>
            )}
        </div>
      </div>
    </div>
  );
}
