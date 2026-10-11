import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReturnService } from "../services/return.service";
import { Return } from "../types/return.types";
import { useStore } from "@/shared/store/useStore";

export const RETURN_QUERY_KEYS = {
  all: ["returns"] as const,
};

export function useReturns() {
  const queryClient = useQueryClient();
  const storeOrders = useStore((state) => state.orders) || [];

  const { data: remoteReturns = [], isLoading } = useQuery<Return[]>({
    queryKey: RETURN_QUERY_KEYS.all,
    queryFn: () => ReturnService.getAllReturns(),
    staleTime: 1000 * 60 * 5,
  });

  const storeReturns: Return[] = storeOrders
    .filter((o) => o.returnStatus && o.returnStatus !== "None")
    .map((o) => {
      const returnDoc = remoteReturns.find((r) => r.orderId === o.id);
      if (returnDoc) return returnDoc;
      return {
        id: `ret-${o.id}`,
        orderId: o.id,
        platformOrderId: o.platformOrderId,
        platform: o.platform,
        productName: o.items?.[0]?.name || "المنتج",
        sku: o.items?.[0]?.sku || "",
        quantity: o.items?.[0]?.quantity || 1,
        returnCondition: (o.returnCondition as any) || "healthy",
        returnStage: "requested",
        caseStatus: "not_opened",
        caseReference: o.returnClaimAmount ? `Claim #${o.id.slice(0, 6)}` : "",
        compensationType: o.returnClaimAmount ? "partial" : "none",
        compensationAmount: Number(o.returnClaimAmount || 0),
        customerRefundAmount: Number(o.refundAmount || o.totalRevenue || 0),
        platformFeeRetained: 0,
        shippingCostRetained: 0,
        netLoss: Number(o.refundAmount || o.totalRevenue || 0) - Number(o.returnClaimAmount || 0),
        restocked: false,
        restockedAt: null,
        createdAt: o.updatedAt || Date.now(),
        updatedAt: o.updatedAt || Date.now(),
      };
    });

  const returnsList = remoteReturns.length > 0 ? remoteReturns : storeReturns;

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Return> }) => {
      const current = returnsList.find((r) => r.id === id);
      return ReturnService.updateReturn(id, updates, current);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURN_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ReturnService.deleteReturn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURN_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return {
    returns: returnsList,
    isLoading,
    updateReturn: updateMutation.mutateAsync,
    deleteReturn: deleteMutation.mutateAsync,
  };
}
