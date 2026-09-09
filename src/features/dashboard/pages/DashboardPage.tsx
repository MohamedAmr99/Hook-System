import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DollarSign, Package, ShoppingCart, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { StatsCard } from "@/shared/components/StatsCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Link } from "react-router-dom";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { Loader2 } from "lucide-react";

export function DashboardPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useDashboardStats();

  // Pagination state for low inventory alerts
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Compute metrics from the real stats
  const totalRevenue = stats?.totalRevenue || 0;
  const totalOrders = stats?.ordersCount || 0;
  const productsCount = stats?.productsCount || 0;  // عدد المنتجات الفعلي
  const totalDamagedGoods = stats?.totalDamagedGoods || 0;

  // Use the sales data from the real stats (or fallback to empty)
  const salesData = stats?.charts.revenueOverview.map(item => ({
    name: item.date,
    total: item.revenue
  })) || [];

  // Low inventory alerts directly from the real stats
  const allLowInventoryItems = stats?.charts.inventoryAlerts.map((p, index) => ({
    id: `alert-${index}`,
    name: p.name,
    sku: p.name,
    stock: p.stock,
    threshold: p.limit
  })) || [];

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(allLowInventoryItems.length / ITEMS_PER_PAGE));
  const paginatedItems = allLowInventoryItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/products/new"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {t("dashboard.addProduct")}
          </Link>
          <Link
            to="/orders/new"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
          >
            {t("dashboard.newOrder")}
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t("dashboard.totalRevenue")}
          value={`${totalRevenue.toFixed(2)} ${t("orders.currency")}`}
          description={t("dashboard.fromLastMonth")}
          trend={{ value: 12, type: "increase" }}
          icon={<DollarSign size={20} />}
        />
        <StatsCard
          title={t("dashboard.orders")}
          value={totalOrders.toString()}
          description={t("dashboard.fromLastMonth")}
          trend={{ value: 5, type: "increase" }}
          icon={<ShoppingCart size={20} />}
        />
        <StatsCard
          title={t("dashboard.productsInStock")}
          value={productsCount.toString()}
          description={t("dashboard.acrossWarehouses")}
          trend={{ value: 0, type: "neutral" }}
          icon={<Package size={20} />}
        />
        <StatsCard
          title={t("dashboard.damagedGoods")}
          value={`${totalDamagedGoods.toFixed(2)} ${t("orders.currency")}`}
          description={t("dashboard.totalClaimsValue")}
          trend={{ value: 0, type: "neutral" }}
          icon={<AlertTriangle size={20} />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Sales Chart */}
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">{t("dashboard.salesOverview")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.salesOverviewDesc")}
            </p>
          </div>
          <div className="p-6 pt-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value} ${t("orders.currency")}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Low Inventory */}
        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold leading-none tracking-tight">{t("dashboard.lowInventoryAlerts")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.lowInventoryDesc")}
            </p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-2">
              {paginatedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/20">
                  <div>
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${item.stock === 0 ? 'text-destructive' : 'text-amber-500'}`}>
                      {item.stock} {t("dashboard.itemsLeft")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("dashboard.minThreshold")}: {item.threshold}
                    </p>
                  </div>
                </div>
              ))}
              {allLowInventoryItems.length === 0 && (
                <div className="text-center p-4 text-muted-foreground text-sm">
                  {t("dashboard.allStocked")}
                </div>
              )}
            </div>

            {/* Pagination */}
            {allLowInventoryItems.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, allLowInventoryItems.length)} من {allLowInventoryItems.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-medium px-2">{currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-3">
              <Link 
                to="/inventory"
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("dashboard.viewFullInventory")} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
