import { useState, useRef } from "react";
import { UploadCloud, Download, X, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useStore } from "@/shared/store/useStore";
import { Order, OrderItem, OrderStatus, PaymentStatus, FinancialStatus } from "../types/order.types";
import { useProducts } from "@/features/products/hooks/useProducts";
import { Button } from "@/shared/components/ui/button";

interface OrderImportModalProps {
  onClose: () => void;
}

const TEMPLATE_HEADERS = [
  "platformOrderId",
  "platform",
  "orderDate",
  "sku",
  "quantity",
  "unitPrice",
  "status",
];

export function OrderImportModal({ onClose }: OrderImportModalProps) {
  const addOrder = useStore(state => state.addOrder);
  const { data: products } = useProducts();
  
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + TEMPLATE_HEADERS.join(",") + "\n" +
      "ORD-001,Noon,2026-09-01,SKU-123,1,150,Delivered\n" +
      "ORD-002,Amazon,2026-09-02,SKU-456,2,300,Pending";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setSuccessCount(null);
    
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Split by lines and remove empty ones
        const lines = text.split("\n").filter(line => line.trim());
        
        if (lines.length < 2) {
          setError("الملف فارغ أو لا يحتوي على بيانات.");
          setIsImporting(false);
          return;
        }

        const headers = lines[0].split(",").map(h => h.trim());
        
        const rows = lines.slice(1).map(line => {
          // Handle values enclosed in quotes
          const values = line.split(",").map(val => val.trim().replace(/^"(.*)"$/, '$1'));
          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || "";
          });
          return rowData;
        });

        let imported = 0;
        
        rows.forEach(row => {
          if (!row.platformOrderId || !row.sku) return; // Skip if missing required fields
          
          const quantity = Number(row.quantity) || 1;
          const unitPrice = Number(row.unitPrice) || 0;
          const status = (row.status || "Pending") as OrderStatus;
          
          // Find product to get cost and name
          const product = products?.find(p => p.sku === row.sku);
          const productId = product?.id || "unknown";
          const productName = product?.productName || "منتج غير معروف";
          const unitCogs = product?.costPrice || 0;

          const item: OrderItem = {
            id: uuidv4(),
            productId,
            sku: row.sku,
            name: productName,
            quantity,
            unitPrice,
            unitCogs,
            discount: 0,
            tax: 0,
          };

          const subtotal = quantity * unitPrice;
          const totalCogs = quantity * unitCogs;
          const grossProfit = subtotal - totalCogs;

          let paymentStatus: PaymentStatus = "Unpaid";
          let financialStatus: FinancialStatus = "Unsettled";
          
          if (status === "Delivered") {
            paymentStatus = "Paid";
            financialStatus = "PendingSettlement";
          }

          const orderDateStr = row.orderDate ? new Date(row.orderDate).getTime() : Date.now();

          const newOrder: Order = {
            id: uuidv4(),
            platformOrderId: row.platformOrderId,
            platform: row.platform || "Own Store",
            status,
            paymentStatus,
            financialStatus,
            returnStatus: "None",
            orderDate: isNaN(orderDateStr) ? Date.now() : orderDateStr,
            items: [item],
            subtotal,
            discountTotal: 0,
            taxTotal: 0,
            shippingCollected: 0,
            totalRevenue: subtotal,
            totalCogs,
            grossProfit,
            sellingFees: 0,
            fulfillmentFees: 0,
            otherFees: 0,
            netPayoutExpected: subtotal,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            createdBy: "System",
            updatedBy: "System"
          };
          
          addOrder(newOrder);
          imported++;
        });

        if (imported === 0) {
          setError("لم يتم العثور على طلبات ببيانات صالحة (رقم الطلب والـ SKU مطلوبان).");
        } else {
          setSuccessCount(imported);
          setTimeout(() => onClose(), 2000);
        }
      } catch (err) {
        setError("حدث خطأ أثناء قراءة الملف. تأكد من أنه بصيغة CSV صحيحة.");
        console.error(err);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-lg">استيراد الطلبات (CSV)</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-card-foreground">1. تحميل القالب</h4>
            <p className="text-sm text-muted-foreground">
              قم بتحميل القالب وتعبئة بيانات الطلبات، مع العلم أن كل طلب يجب أن يحتوي على منتج واحد (صف واحد).
            </p>
            <Button 
              variant="outline" 
              className="w-full gap-2 justify-start" 
              onClick={downloadTemplate}
            >
              <Download size={18} />
              تحميل قالب CSV
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-card-foreground">2. رفع الملف</h4>
            <p className="text-sm text-muted-foreground">
              ارفع ملف الـ CSV بعد تعبئته.
            </p>
            <div className="relative">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button 
                variant="default" 
                className="w-full gap-2 justify-start" 
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={18} />
                {isImporting ? "جاري الرفع..." : "رفع ملف الطلبات"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-start gap-2 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 p-3 rounded-lg flex items-start gap-2 text-sm">
              <UploadCloud size={16} className="mt-0.5 shrink-0" />
              <span>تم استيراد {successCount} طلب بنجاح! جاري الإغلاق...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
