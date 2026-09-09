import { useState } from "react";
import { useStore } from "@/shared/store/useStore";
import { Button } from "@/shared/components/ui/button";
import { productRepository } from "@/features/products/repositories/product.repository";
import { orderRepository } from "@/features/orders/repositories/order.repository";
import { purchaseRepository } from "@/features/purchases/repositories/purchase.repository";
import { Product } from "@/features/products/types/product.types";
import { Order } from "@/features/orders/types/order.types";
import { Purchase } from "@/features/purchases/types/purchase.types";

export function MigrationTool() {
  const { products, orders, purchases } = useStore();
  const [isMigrating, setIsMigrating] = useState(false);
  const [status, setStatus] = useState<string>("");

  const handleMigration = async () => {
    if (!window.confirm("Are you sure you want to migrate local data to Firebase? This cannot be undone.")) return;
    
    setIsMigrating(true);
    try {
      setStatus("Migrating Products...");
      for (const p of products) {
        const productData: Omit<Product, "id"> = {
          ...p,
          // Handle potential missing fields from old schema
          aiPrompt: p.aiPrompt || "",
          aiGeneratedDescription: p.aiGeneratedDescription || "",
          thumbnail: p.thumbnail || "",
          gallery: p.gallery || [],
          videos: p.videos || [],
          listingUrls: p.listingUrls || {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: "SystemMigration",
          updatedBy: "SystemMigration",
          archived: false,
        };
        // Use SKU as document ID for easier references if desired, or let Firebase auto-gen
        await productRepository.create(productData);
      }

      setStatus("Migrating Purchases...");
      for (const pur of purchases as any[]) {
        const purchaseData: Omit<Purchase, "id"> = {
          supplierId: "LegacySupplier",
          supplierName: pur.supplierName,
          purchaseDate: new Date(pur.purchaseDate).getTime(),
          status: pur.status as any,
          paymentStatus: pur.status === "Received" ? "Paid" : "Unpaid", // Estimated assumption for legacy
          items: pur.items.map((i: any) => ({
            id: i.id,
            productId: i.sku, // Link by SKU for legacy
            sku: i.sku,
            name: i.name,
            orderedQuantity: i.quantity,
            receivedQuantity: pur.status === "Received" ? i.quantity : 0,
            unitCost: i.unitCost
          })),
          subtotal: pur.totalCost,
          shippingCost: pur.shippingCost || 0,
          tax: 0,
          otherExpenses: pur.otherExpenses || 0,
          totalCost: pur.totalCost,
          amountPaid: pur.status === "Received" ? pur.totalCost : 0,
          balanceDue: pur.status === "Received" ? 0 : pur.totalCost,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: "SystemMigration",
          updatedBy: "SystemMigration"
        };
        await purchaseRepository.create(purchaseData);
      }

      setStatus("Migrating Orders...");
      for (const o of orders as any[]) {
        const orderData: Omit<Order, "id"> = {
          platformOrderId: o.platformOrderId || "Legacy",
          platform: o.platform,
          status: o.status as any,
          paymentStatus: "Paid", // Assuming paid for legacy orders mostly
          financialStatus: "Settled",
          returnStatus: o.returnDetails?.isReturned ? "Returned" : "None",
          orderDate: new Date(o.orderDate).getTime(),
          items: o.items.map((i: any) => ({
            id: i.id,
            productId: i.sku,
            sku: i.sku,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            unitCogs: 0, // Marked as 0/Unknown for legacy
            discount: 0,
            tax: 0
          })),
          subtotal: o.productSales || 0,
          discountTotal: Math.abs(o.promotions || 0),
          taxTotal: 0,
          shippingCollected: o.shippingCredits || 0,
          totalRevenue: (o.productSales || 0) + (o.shippingCredits || 0) - Math.abs(o.promotions || 0),
          totalCogs: 0, // Estimated/Unverified
          grossProfit: (o.productSales || 0) + (o.shippingCredits || 0) - Math.abs(o.promotions || 0), // Gross without COGS
          sellingFees: o.sellingFees || 0,
          fulfillmentFees: o.fulfillmentFees || 0,
          otherFees: (o.shippingCost || 0) + (o.otherFees || 0),
          netPayoutExpected: o.netPayout || 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: "SystemMigration",
          updatedBy: "SystemMigration"
        };
        await orderRepository.create(orderData);
      }

      setStatus("Migration Complete!");
    } catch (error) {
      console.error(error);
      setStatus("Migration Failed. Check Console.");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow-sm bg-yellow-50 mb-6">
      <h3 className="font-bold mb-2 text-yellow-800">Legacy Data Migration</h3>
      <p className="text-sm text-yellow-700 mb-4">
        Migrate local data (Zustand) to Firebase. Ensure you have backed up local storage.
      </p>
      <Button onClick={handleMigration} disabled={isMigrating} variant="default">
        {isMigrating ? "Migrating..." : "Run Migration"}
      </Button>
      {status && <p className="mt-2 text-sm font-semibold">{status}</p>}
    </div>
  );
}
