import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryService } from "../services/category.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { Category } from "../types/platform.types";

export const CATEGORY_QUERY_KEYS = {
  all: ["categories"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.all,
    queryFn: () => CategoryService.getCategories(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (data: Pick<Category, "name" | "description">) =>
      CategoryService.createCategory(data, user!.uid, user!.displayName ?? "System"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.all }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Category, "name" | "description">> }) =>
      CategoryService.updateCategory(id, data, user!.displayName ?? "System"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.all }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => CategoryService.deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.all }),
  });
}
