import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlatformService } from "../services/platform.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { Platform } from "../types/platform.types";

export const PLATFORM_QUERY_KEYS = {
  all: ["platforms"] as const,
};

export function usePlatforms() {
  return useQuery({
    queryKey: PLATFORM_QUERY_KEYS.all,
    queryFn: () => PlatformService.getPlatforms(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreatePlatform() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (data: Pick<Platform, "name" | "logoUrl" | "categories">) =>
      PlatformService.createPlatform(data, user!.uid, user!.displayName ?? "System"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLATFORM_QUERY_KEYS.all }),
  });
}

export function useUpdatePlatform() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Platform, "name" | "logoUrl" | "categories">> }) =>
      PlatformService.updatePlatform(id, data, user!.displayName ?? "System"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLATFORM_QUERY_KEYS.all }),
  });
}

export function useDeletePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => PlatformService.deletePlatform(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLATFORM_QUERY_KEYS.all }),
  });
}
