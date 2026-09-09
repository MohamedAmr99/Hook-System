import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { OrderInput, OrderSchema } from "../schemas/order.schema";
import { useStore } from "@/shared/store/useStore";
import { useProducts, PRODUCT_QUERY_KEYS } from "@/features/products/hooks/useProducts";
import { ProductService } from "@/features/products/services/product.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { Order, OrderStatus, PaymentStatus } from "../types/order.types";
import { usePlatforms } from "@/features/platforms/hooks/usePlatforms";
import { Plus, Trash2 } from "lucide-react";

interface OrderFormProps {
  initialData?: Order;
  onSuccess: () => void;
}

const ORDER_STATUSES: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const PAYMENT_STATUSES: PaymentStatus[] = ["Unpaid", "Paid", "PartiallyRefunded", "Refunded"];

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:text-muted-foreground";
const smallInputCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function OrderForm({ initialData, onSuccess }: OrderFormProps) {
  const { t } = useTranslation();
  const addOrder = useStore(state => state.addOrder);
  const updateOrder = useStore(state => state.updateOrder);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();
  const { data: platforms = [] } = usePlatforms();
  
  const [productSearch, setProductSearch] = useState<Record<number, string>>({});
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdowns({});
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setValue, control } = useForm<OrderInput>({
    resolver: zodResolver(OrderSchema) as any,
    defaultValues: initialData ? {
      platform: initialData.platform,
      platformOrderId: initialData.platformOrderId,
      status: initialData.status,
      paymentStatus: initialData.paymentStatus,
      financialStatus: initialData.financialStatus,
      returnStatus: initialData.returnStatus,
      orderDate: initialData.orderDate,
      items: initialData.items,
      subtotal: initialData.subtotal,
      discountTotal: initialData.discountTotal,
      taxTotal: initialData.taxTotal,
      shippingCollected: initialData.shippingCollected,
      totalRevenue: initialData.totalRevenue,
      totalCogs: initialData.totalCogs,
      grossProfit: initialData.grossProfit,
      sellingFees: initialData.sellingFees,
      fulfillmentFees: initialData.fulfillmentFees,
      otherFees: initialData.otherFees,
      netPayoutExpected: initialData.netPayoutExpected,
      settlementId: initialData.settlementId || "",
    } : {
      platformOrderId: "",
      platform: "",
      status: "Pending",
      paymentStatus: "Unpaid",
      financialStatus: "Unsettled",
      returnStatus: "None",
      orderDate: Date.now(),
      items: [{ productId: "", sku: "", name: "", quantity: 1, unitPrice: 0, unitCogs: 0, discount: 0, tax: 0 }],
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      shippingCollected: 0,
      totalRevenue: 0,
      totalCogs: 0,
      grossProfit: 0,
      sellingFees: 0,
      fulfillmentFees: 0,
      otherFees: 0,
      netPayoutExpected: 0,
      settlementId: "",
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const subtotal   = watch("subtotal")   || 0;
  const discountTotal = watch("discountTotal") || 0;
  const taxTotal     = watch("taxTotal")     || 0;
  const shippingCollected = watch("shippingCollected") || 0;
  
  const sellingFees    = watch("sellingFees")    || 0;
  const fulfillmentFees = watch("fulfillmentFees") || 0;
  const otherFees      = watch("otherFees")      || 0;
  const selectedPlatform = watch("platform");
  const items          = watch("items");

  useEffect(() => {
    let totalSales = 0;
    let totalCogs = 0;
    let totalCommission = 0;

    const platformDoc = platforms.find(p => p.name === selectedPlatform || p.id === selectedPlatform);

    items.forEach((item, index) => {
      if (item.sku) {
        const product = products.find(p => p.sku === item.sku);
        if (product) {
          if (item.name !== product.productName) {
            setValue(`items.${index}.name`, product.productName);
            setProductSearch(prev => ({ ...prev, [index]: `${product.productName} (${product.sku})` }));
          }
          if (item.unitPrice === 0) {
             setValue(`items.${index}.unitPrice`, product.sellingPrice);
          }
          if (item.unitCogs === 0 && product.costPrice) {
             setValue(`items.${index}.unitCogs`, product.costPrice);
          }
          
          const qty = item.quantity || 1;
          const price = watch(`items.${index}.unitPrice`) || product.sellingPrice;
          const cogs = watch(`items.${index}.unitCogs`) || product.costPrice || 0;
          
          totalSales += (qty * price);
          totalCogs += (qty * cogs);

          if (platformDoc && product.category) {
             const platCat = platformDoc.categories.find(c => c.categoryName === product.category);
             if (platCat) {
                totalCommission += (qty * price * platCat.commissionRate) / 100;
             }
          }
        }
      }
    });

    setValue("subtotal", Number(totalSales.toFixed(2)));
    setValue("totalCogs", Number(totalCogs.toFixed(2)));
    setValue("sellingFees", Number(totalCommission.toFixed(2)));

  }, [JSON.stringify(items.map(i => `${i.sku}-${i.quantity}-${i.unitPrice}-${i.unitCogs}`)), selectedPlatform, platforms, products, setValue]);

  useEffect(() => {
    const revenue = Number(subtotal) - Number(discountTotal) + Number(taxTotal) + Number(shippingCollected);
    const deductions = Number(sellingFees) + Number(fulfillmentFees) + Number(otherFees);
    const net = revenue - deductions;
    
    setValue("totalRevenue", Number(revenue.toFixed(2)));
    setValue("grossProfit", Number((revenue - Number(watch("totalCogs") || 0)).toFixed(2)));
    setValue("netPayoutExpected", Number(net.toFixed(2)));
  }, [subtotal, discountTotal, taxTotal, shippingCollected, sellingFees, fulfillmentFees, otherFees, setValue, watch]);

  const currency = t("orders.currency", "EGP");

  const onSubmit = async (data: OrderInput) => {
    const platName = platforms.find(p => p.id === data.platform)?.name || data.platform;
    const finalData = { ...data, platform: platName };

    if (initialData) {
      const oldOrder = initialData;
      updateOrder(oldOrder.id, { ...finalData, updatedAt: Date.now(), updatedBy: user?.uid } as any);

      if (user) {
        for (const newItem of finalData.items) {
          const oldItem = oldOrder.items.find(i => i.productId === newItem.productId);
          const oldQty = oldItem?.quantity ?? 0;
          const diff = newItem.quantity - oldQty; 
          if (diff !== 0) {
            const firebaseProduct = products.find(p => p.id === newItem.productId);
            if (firebaseProduct) {
              await ProductService.updateProduct(
                firebaseProduct.id,
                { quantity: Math.max(0, (firebaseProduct.quantity || 0) - diff) },
                user.uid,
                user.displayName ?? "System"
              );
            }
          }
        }
        queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      }
    } else {
      const newOrder: Order = {
        ...finalData,
        id: uuidv4(),
        items: finalData.items.map(i => ({...i, id: uuidv4()})),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: user?.uid || "",
        updatedBy: user?.uid || "",
      };
      addOrder(newOrder);

      if (user) {
        for (const item of finalData.items) {
          const firebaseProduct = products.find(p => p.id === item.productId);
          if (firebaseProduct) {
            await ProductService.updateProduct(
              firebaseProduct.id,
              { quantity: Math.max(0, (firebaseProduct.quantity || 0) - item.quantity) },
              user.uid,
              user.displayName ?? "System"
            );
          }
        }
        queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      }
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
      {/* 1. Order Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">{t("orders.form.orderInfo")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("orders.form.platformOrderId")} <span className="text-destructive">*</span>
            </label>
            <input
              {...register("platformOrderId")}
              className={inputCls}
              placeholder={t("orders.form.platformOrderIdPlaceholder")}
            />
            {errors.platformOrderId && (
              <span className="text-xs text-destructive">{errors.platformOrderId.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("orders.form.platform")}</label>
            <select {...register("platform")} className={inputCls}>
              <option value="">-- اختر المنصة --</option>
              {platforms.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            {errors.platform && (
              <span className="text-xs text-destructive">{errors.platform.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Order Status</label>
            <select {...register("status")} className={inputCls}>
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{t(`orders.statuses.${s}`, s)}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Payment Status</label>
            <select {...register("paymentStatus")} className={inputCls}>
              {PAYMENT_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("orders.form.orderDate")}</label>
            <input
              type="date"
              value={new Date(watch("orderDate") || Date.now()).toISOString().substring(0, 10)}
              onChange={(e) => setValue("orderDate", new Date(e.target.value).getTime())}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* 2. Product Details */}
      <section className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
           <h3 className="text-lg font-semibold">{t("orders.form.productDetails")}</h3>
           <button
             type="button"
             onClick={() => append({ productId: "", sku: "", name: "", quantity: 1, unitPrice: 0, unitCogs: 0, discount: 0, tax: 0 })}
             className="flex items-center gap-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
           >
             <Plus size={16} />
             إضافة منتج
           </button>
        </div>
        
        <div className="space-y-4" ref={dropdownRef}>
          {fields.map((field, index) => {
             const currentSearch = productSearch[index] || "";
             const filteredProducts = products.filter(p => {
               if (!currentSearch) return true;
               const q = currentSearch.toLowerCase();
               return p.productName.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
             });

             return (
               <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-secondary/5 p-4 rounded-lg border">
                 {/* Product Search */}
                 <div className="md:col-span-5 relative">
                   <label className="block text-sm font-medium mb-1">المنتج <span className="text-destructive">*</span></label>
                   <input
                     type="text"
                     className={inputCls}
                     placeholder={isLoadingProducts ? "جاري التحميل..." : "ابحث عن طريق الاسم أو SKU"}
                     value={currentSearch}
                     onChange={(e) => {
                       setProductSearch(prev => ({ ...prev, [index]: e.target.value }));
                       setOpenDropdowns(prev => ({ ...prev, [index]: true }));
                       if (e.target.value === "") setValue(`items.${index}.sku`, "");
                     }}
                     onFocus={() => setOpenDropdowns(prev => ({ ...prev, [index]: true }))}
                   />
                   
                   {openDropdowns[index] && (
                     <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                       {filteredProducts.map(p => (
                           <div 
                             key={p.sku}
                             className="px-3 py-2 cursor-pointer hover:bg-accent text-sm flex justify-between"
                             onClick={() => {
                               setValue(`items.${index}.productId`, p.id);
                               setValue(`items.${index}.sku`, p.sku, { shouldValidate: true });
                               setValue(`items.${index}.name`, p.productName);
                               setValue(`items.${index}.unitPrice`, p.sellingPrice);
                               setValue(`items.${index}.unitCogs`, p.costPrice || 0);
                               setProductSearch(prev => ({ ...prev, [index]: `${p.productName} (${p.sku})` }));
                               setOpenDropdowns(prev => ({ ...prev, [index]: false }));
                             }}
                           >
                             <span className="truncate pr-2">{p.productName} ({p.sku})</span>
                             <span className="text-muted-foreground whitespace-nowrap text-xs">{p.quantity} متاح</span>
                           </div>
                       ))}
                       {filteredProducts.length === 0 && (
                         <div className="px-3 py-2 text-sm text-muted-foreground">لا يوجد منتجات</div>
                       )}
                     </div>
                   )}
                   {errors.items?.[index]?.sku && (
                     <span className="text-xs text-destructive">{errors.items[index]?.sku?.message}</span>
                   )}
                   <input type="hidden" {...register(`items.${index}.productId`)} />
                 </div>

                 {/* Name (auto) */}
                 <div className="md:col-span-3">
                   <label className="block text-sm font-medium mb-1">الاسم (يملأ تلقائياً)</label>
                   <input
                     readOnly
                     {...register(`items.${index}.name` as const)}
                     className={`${inputCls} bg-muted cursor-not-allowed`}
                   />
                 </div>

                 {/* Quantity */}
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium mb-1">الكمية</label>
                   <input
                     type="number"
                     min={1}
                     {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                     className={inputCls}
                   />
                 </div>

                 {/* Unit Price */}
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium mb-1">سعر الوحدة ({currency})</label>
                   <div className="flex gap-2 items-center">
                     <input
                       type="number"
                       step="0.01"
                       {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                       className={inputCls}
                     />
                     {fields.length > 1 && (
                       <button
                         type="button"
                         onClick={() => remove(index)}
                         className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                       >
                         <Trash2 size={18} />
                       </button>
                     )}
                   </div>
                 </div>
               </div>
             );
          })}
        </div>
      </section>

      {/* 3. Financials */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">{t("orders.form.financialBreakdown")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-3 p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
            <h4 className="font-medium text-emerald-600 dark:text-emerald-400">
              {t("orders.form.customerPayments")}
            </h4>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Subtotal ({currency})
              </label>
              <input type="number" step="0.01" {...register("subtotal", { valueAsNumber: true })} className={smallInputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Shipping Collected ({currency})
              </label>
              <input type="number" step="0.01" {...register("shippingCollected", { valueAsNumber: true })} className={smallInputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Discounts ({currency})
              </label>
              <input type="number" step="0.01" {...register("discountTotal", { valueAsNumber: true })} className={smallInputCls} />
            </div>
          </div>

          <div className="space-y-3 p-4 bg-destructive/5 rounded-lg border border-destructive/20 relative">
            <h4 className="font-medium text-destructive">{t("orders.form.platformFees")}</h4>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t("orders.form.sellingFees")} ({currency})
              </label>
              <input 
                type="number" 
                step="0.01" 
                {...register("sellingFees", { valueAsNumber: true })} 
                className={`${smallInputCls} border-primary focus-visible:ring-primary`} 
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t("orders.form.fulfillmentFees")} ({currency})
              </label>
              <input type="number" step="0.01" {...register("fulfillmentFees", { valueAsNumber: true })} className={smallInputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t("orders.form.otherFees")} ({currency})
              </label>
              <input type="number" step="0.01" {...register("otherFees", { valueAsNumber: true })} className={smallInputCls} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-secondary/10 rounded-lg border">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Net Expected</h4>
            <div className={`text-3xl font-bold ${watch("netPayoutExpected") >= 0 ? "text-emerald-500" : "text-destructive"}`}>
              {watch("netPayoutExpected").toFixed(2)} {currency}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4 max-w-[200px]">
              Revenue - Deductions
            </p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onSuccess}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          {t("orders.form.cancel", "إلغاء")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
        >
          {isSubmitting ? t("orders.form.saving", "جاري الحفظ...") : t("orders.form.save", "حفظ")}
        </button>
      </div>
    </form>
  );
}
