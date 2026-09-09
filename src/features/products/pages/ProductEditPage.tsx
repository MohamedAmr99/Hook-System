import { useParams, useNavigate } from "react-router-dom";
import { ProductForm } from "../components/ProductForm";
import { useProduct, useUpdateProductMutation } from "../hooks/useProducts";
import { Loader2 } from "lucide-react";
import type { ProductFormValues } from "../schemas/product.schema";

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: product, isLoading, error } = useProduct(id);
  const { mutate: updateProduct, isPending } = useUpdateProductMutation();

  const handleSubmit = (data: ProductFormValues) => {
    if (!id) return;
    updateProduct(
      { id, data },
      {
        onSuccess: () => {
          navigate("/products");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] space-y-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-semibold">Loading product parameters...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-center space-y-4">
        <p className="text-sm font-semibold text-destructive">
          Error: Product not found or failed to load.
        </p>
        <button
          onClick={() => navigate("/products")}
          className="text-xs text-primary font-bold hover:underline"
        >
          Return to Products Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <ProductForm
        initialData={product}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        onCancel={() => navigate("/products")}
      />
    </div>
  );
}
