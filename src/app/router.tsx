import { createBrowserRouter } from "react-router-dom"
import { AppLayout } from "@/shared/layouts/AppLayout"
import { ProtectedRoute, GuestRoute } from "@/features/auth/components/AuthGuards"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { ProductListPage } from "@/features/products/pages/ProductListPage"
import { ProductCreatePage } from "@/features/products/pages/ProductCreatePage"
import { ProductEditPage } from "@/features/products/pages/ProductEditPage"
import { OrderListPage } from "@/features/orders/pages/OrderListPage"
import { OrderCreatePage } from "@/features/orders/pages/OrderCreatePage"
import { OrderEditPage } from "@/features/orders/pages/OrderEditPage"
import { ReturnListPage } from "@/features/orders/pages/ReturnListPage"
import { FinanceDashboardPage } from "@/features/finance/pages/FinanceDashboardPage"
import { CollectionListPage } from "@/features/finance/pages/CollectionListPage"

import { PurchaseListPage } from "@/features/purchases/pages/PurchaseListPage"
import { PurchaseCreatePage } from "@/features/purchases/pages/PurchaseCreatePage"
import { PurchaseEditPage } from "@/features/purchases/pages/PurchaseEditPage"
import { PurchaseDetailsPage } from "@/features/purchases/pages/PurchaseDetailsPage"
import { CategoryListPage } from "@/features/platforms/pages/CategoryListPage"
import { PlatformListPage } from "@/features/platforms/pages/PlatformListPage"
import { SettingsPage } from "@/features/settings/pages/SettingsPage"
import { ExpenseListPage } from "@/features/finance/pages/ExpenseListPage"
import { LoansPage } from "@/features/loans/pages/LoansPage"
import { PricingCalculatorPage } from "@/features/calculator/pages/PricingCalculatorPage"

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ]
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "products", element: <ProductListPage /> },
          { path: "products/new", element: <ProductCreatePage /> },
          { path: "products/:id/edit", element: <ProductEditPage /> },
          { path: "inventory", element: <div className="text-xl font-bold">Inventory</div> },
          { path: "orders", element: <OrderListPage /> },
          { path: "orders/new", element: <OrderCreatePage /> },
          { path: "orders/:id/edit", element: <OrderEditPage /> },
          { path: "returns", element: <ReturnListPage /> },
          { path: "purchases", element: <PurchaseListPage /> },
          { path: "purchases/new", element: <PurchaseCreatePage /> },
          { path: "purchases/:id/edit", element: <PurchaseEditPage /> },
          { path: "purchases/:id/view", element: <PurchaseDetailsPage /> },
          { path: "expenses", element: <ExpenseListPage /> },
          { path: "categories", element: <CategoryListPage /> },
          { path: "platforms", element: <PlatformListPage /> },
          { path: "finance", element: <FinanceDashboardPage /> },
          { path: "finance/collections", element: <CollectionListPage /> },
          { path: "media", element: <div className="text-xl font-bold">Media</div> },
          { path: "tasks", element: <div className="text-xl font-bold">Tasks</div> },
          { path: "loans", element: <LoansPage /> },
          { path: "calculator", element: <PricingCalculatorPage /> },
          { path: "notifications", element: <div className="text-xl font-bold">Notifications</div> },
          { path: "settings", element: <SettingsPage /> },
        ]
      }
    ]
  }
])
