import { useStore } from "@/shared/store/useStore";
import { useProducts } from "@/features/products/hooks/useProducts";
import { calculateOrderFinancials } from "@/shared/utils/orderCalculations";

export interface DashboardStats {
  totalRevenue: number;
  ordersCount: number;
  productsCount: number;
  productsInStock: number;
  totalDamagedGoods: number;
  charts: {
    revenueOverview: Array<{ date: string; revenue: number }>;
    inventoryAlerts: Array<{ name: string; stock: number; limit: number }>;
  };
}

export function useDashboardStats() {
  const storeOrders = useStore((state) => state.orders) || [];
  const storeProducts = useStore((state) => state.products) || [];
  const { data: reactQueryProducts, isLoading: isLoadingProducts } = useProducts();

  const productsList =
    reactQueryProducts && reactQueryProducts.length > 0
      ? reactQueryProducts
      : storeProducts;

  // Single Source of Truth financial calculations using calculateOrderFinancials
  const totalRevenue = storeOrders.reduce((sum, order) => {
    const financials = calculateOrderFinancials(order);
    return sum + financials.effectiveRevenue;
  }, 0);

  const ordersCount = storeOrders.length;
  const productsCount = productsList.length;

  const productsInStock = productsList.reduce((sum, p) => {
    const avail = Math.max(
      0,
      Number(p.quantity || 0) -
        Number(p.reservedQuantity || 0) -
        Number(p.unavailableQuantity || 0)
    );
    return sum + avail;
  }, 0);

  const totalDamagedGoods = storeOrders.reduce((sum, order) => {
    if (
      order.returnCondition &&
      ["Damaged", "MissingParts"].includes(order.returnCondition)
    ) {
      return sum + Number(order.totalRevenue || 0);
    }
    return sum;
  }, 0);

  // Group sales data by date for chart
  const salesMap = new Map<string, number>();
  storeOrders.forEach((order) => {
    const dateStr = new Date(order.orderDate || Date.now()).toLocaleDateString(
      "ar-EG",
      {
        month: "short",
        day: "numeric",
      }
    );
    const financials = calculateOrderFinancials(order);
    salesMap.set(dateStr, (salesMap.get(dateStr) || 0) + financials.effectiveRevenue);
  });

  const revenueOverview = Array.from(salesMap.entries()).map(
    ([date, revenue]) => ({
      date,
      revenue,
    })
  );

  // Low stock inventory alerts
  const inventoryAlerts = productsList
    .filter((p) => {
      const avail =
        Number(p.quantity || 0) -
        Number(p.reservedQuantity || 0) -
        Number(p.unavailableQuantity || 0);
      return avail <= (p.minimumStockAlert || 5);
    })
    .map((p) => ({
      name: p.productName,
      stock: Math.max(
        0,
        Number(p.quantity || 0) -
          Number(p.reservedQuantity || 0) -
          Number(p.unavailableQuantity || 0)
      ),
      limit: p.minimumStockAlert || 5,
    }));

  return {
    data: {
      totalRevenue,
      ordersCount,
      productsCount,
      productsInStock,
      totalDamagedGoods,
      charts: {
        revenueOverview,
        inventoryAlerts,
      },
    },
    isLoading: isLoadingProducts,
  };
}
