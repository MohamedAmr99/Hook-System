import { useNavigate } from "react-router-dom";
import { ProductForm } from "../components/ProductForm";
import { useCreateProductMutation } from "../hooks/useProducts";
import type { ProductFormValues } from "../schemas/product.schema";

export function ProductCreatePage() {
  const navigate = useNavigate();
  const { mutate: createProduct, isPending } = useCreateProductMutation();

  const handleSubmit = (data: ProductFormValues) => {
    // Format schema data if needed, then execute create
    createProduct(data, {
      onSuccess: () => {
        navigate("/products");
      }
    });
  };

  return (
    <div className="py-2">
      <ProductForm
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        onCancel={() => navigate("/products")}
      />
    </div>
  );
}
