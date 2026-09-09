import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductService } from "../services/product.service";
import type { Product, ProductFilters } from "../types";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { toast } from "sonner";

export const PRODUCT_QUERY_KEYS = {
  all: ["products"] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, "list"] as const,
  list: (filters: ProductFilters) => [...PRODUCT_QUERY_KEYS.lists(), filters] as const,
  details: () => [...PRODUCT_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PRODUCT_QUERY_KEYS.details(), id] as const,
};

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(filters),
    queryFn: () => ProductService.getProducts(filters),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(id || ""),
    queryFn: () => {
      if (!id) return null;
      return ProductService.getProductById(id);
    },
    enabled: !!id,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (data: Omit<Product, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "archived">) => {
      if (!user) throw new Error("Authenticated user required to create products");
      return ProductService.createProduct(data, user.uid, user.displayName);
    },
    onSuccess: (newProduct) => {
      toast.success(`Product "${newProduct.productName}" created successfully`);
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create product");
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => {
      if (!user) throw new Error("Authenticated user required to update products");
      return ProductService.updateProduct(id, data, user.uid, user.displayName);
    },
    onSuccess: (_, variables) => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(variables.id) });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update product");
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => {
      if (!user) throw new Error("Authenticated user required to delete products");
      return ProductService.deleteProduct(id, user.uid, user.displayName);
    },
    onMutate: async (id: string) => {
      // Cancel outgoing refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      // Optimistically remove the product from all list caches immediately
      queryClient.setQueriesData<Product[]>(
        { queryKey: PRODUCT_QUERY_KEYS.all },
        (old) => (old ? old.filter((p) => p.id !== id) : []),
      );
    },
    onSuccess: () => {
      toast.success("تم حذف المنتج نهائياً");
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
    onError: (error: any) => {
      // Rollback by re-fetching
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      toast.error(error.message || "فشل حذف المنتج");
    },
  });
}

export function useArchiveProductMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) => {
      if (!user) throw new Error("Authenticated user required to archive/unarchive products");
      return ProductService.archiveProduct(id, archived, user.uid, user.displayName);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.archived ? "Product archived successfully" : "Product restored successfully");
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(variables.id) });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to change product status");
    },
  });
}
