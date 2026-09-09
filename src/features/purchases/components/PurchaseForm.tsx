import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PurchaseInput, PurchaseSchema } from "../schemas/purchase.schema";
import { useStore } from "@/shared/store/useStore";
import { useProducts, PRODUCT_QUERY_KEYS } from "@/features/products/hooks/useProducts";
import { ProductService } from "@/features/products/services/product.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { Purchase } from "../types/purchase.types";
import { Trash2, Plus } from "lucide-react";

interface PurchaseFormProps {
  initialData?: Purchase;
  onSuccess: () => void;
}

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:text-muted-foreground";

export function PurchaseForm({ initialData, onSuccess }: PurchaseFormProps) {
  const { t } = useTranslation();
  const addPurchase = useStore(state => state.addPurchase);
  const updatePurchase = useStore(state => state.updatePurchase);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const currency = t("orders.currency");

  // Real products from Firebase
  const { data: products = [] } = useProducts();

  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting }, setValue } =
    useForm<PurchaseInput>({
      resolver: zodResolver(PurchaseSchema) as any,
      defaultValues: initialData
        ? {
            supplierId: initialData.supplierId,
            supplierName: initialData.supplierName,
            status: initialData.status,
            paymentStatus: initialData.paymentStatus,
            purchaseDate: initialData.purchaseDate,
            items: initialData.items,
            subtotal: initialData.subtotal,
            shippingCost: initialData.shippingCost,
            tax: initialData.tax,
            otherExpenses: initialData.otherExpenses,
            totalCost: initialData.totalCost,
            amountPaid: initialData.amountPaid,
            balanceDue: initialData.balanceDue,
          }
        : {
            supplierId: "",
            supplierName: "",
            status: "Pending",
            paymentStatus: "Unpaid",
            purchaseDate: Date.now(),
            items: [{ productId: "", sku: "", name: "", orderedQuantity: 1, receivedQuantity: 0, unitCost: 0 }],
            subtotal: 0,
            shippingCost: 0,
            tax: 0,
            otherExpenses: 0,
            totalCost: 0,
            amountPaid: 0,
            balanceDue: 0,
          },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items") || [];
  const shippingCost = watch("shippingCost") || 0;
  const tax = watch("tax") || 0;
  const otherExpenses = watch("otherExpenses") || 0;
  const amountPaid = watch("amountPaid") || 0;
  const totalCost = watch("totalCost");

  // Auto-calculate totals
  React.useEffect(() => {
    const itemsTotal = watchedItems.reduce((acc, item) => acc + (Number(item.orderedQuantity) * Number(item.unitCost)), 0);
    const newTotal = itemsTotal + Number(shippingCost) + Number(tax) + Number(otherExpenses);
    setValue("subtotal", Number(itemsTotal.toFixed(2)));
    setValue("totalCost", Number(newTotal.toFixed(2)));
    setValue("balanceDue", Number((newTotal - Number(amountPaid)).toFixed(2)));
  }, [watchedItems, shippingCost, tax, otherExpenses, amountPaid, setValue]);


  // Search/dropdown state for each row
  const [openDropdownIndex, setOpenDropdownIndex] = React.useState<number | null>(null);
  const [productSearch, setProductSearch] = React.useState<Record<number, string>>({});
  
  // Initialize product search terms on load
  React.useEffect(() => {
    if (products.length > 0 && watchedItems.length > 0) {
      const initialSearches: Record<number, string> = {};
      watchedItems.forEach((item, index) => {
        if (item.sku) {
          const p = products.find(p => p.sku === item.sku);
          if (p) initialSearches[index] = `${p.productName} (${p.sku})`;
        }
      });
      setProductSearch(prev => Object.keys(prev).length === 0 ? initialSearches : prev);
    }
  }, [products]); // Only run when products load initially

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProduct = (index: number, p: (typeof products)[0]) => {
    setValue(`items.${index}.productId`, p.id);
    setValue(`items.${index}.sku`, p.sku);
    setValue(`items.${index}.name`, p.productName);
    setValue(`items.${index}.unitCost`, p.costPrice || 0);
    setProductSearch(prev => ({ ...prev, [index]: `${p.productName} (${p.sku})` }));
    setOpenDropdownIndex(null);
  };

  // ── SUBMIT ─────────────────────────────────────────────────────────────
  const onSubmit = async (data: PurchaseInput) => {
    if (!user) return;

    if (initialData) {
      // ─── EDIT ──────────────────────────────────────────────────────────
      const oldPurchase = initialData;
      const wasReceived = oldPurchase.status === "Received";
      const isNowReceived = data.status === "Received";

      updatePurchase(oldPurchase.id, { ...data, updatedAt: Date.now(), updatedBy: user.uid } as any);

      if (wasReceived && !isNowReceived) {
        for (const oldItem of oldPurchase.items) {
          const fp = products.find(p => p.id === oldItem.productId);
          if (fp) {
            await ProductService.updateProduct(
              fp.id,
              { quantity: Math.max(0, (fp.quantity || 0) - oldItem.orderedQuantity) },
              user.uid, user.displayName ?? "System"
            );
          }
        }
      } else if (!wasReceived && isNowReceived) {
        for (const newItem of data.items) {
          const fp = products.find(p => p.id === newItem.productId);
          if (fp) {
            await ProductService.updateProduct(
              fp.id,
              { 
                quantity: (fp.quantity || 0) + newItem.orderedQuantity,
                costPrice: newItem.unitCost
              },
              user.uid, user.displayName ?? "System"
            );
          }
        }
      } else if (wasReceived && isNowReceived) {
        for (const oldItem of oldPurchase.items) {
          const fp = products.find(p => p.id === oldItem.productId);
          if (fp) {
            await ProductService.updateProduct(
              fp.id,
              { quantity: Math.max(0, (fp.quantity || 0) - oldItem.orderedQuantity) },
              user.uid, user.displayName ?? "System"
            );
          }
        }
        for (const newItem of data.items) {
          const fp = products.find(p => p.id === newItem.productId);
          if (fp) {
            const oldQty = oldPurchase.items.find(i => i.productId === newItem.productId)?.orderedQuantity || 0;
            const diff = newItem.orderedQuantity - oldQty;
            
            await ProductService.updateProduct(
              fp.id,
              { 
                quantity: Math.max(0, (fp.quantity || 0) + diff),
                costPrice: newItem.unitCost
              },
              user.uid, user.displayName ?? "System"
            );
          }
        }
      }
    } else {
      // ─── CREATE ────────────────────────────────────────────────────────
      const newPurchase: Purchase = {
        ...data,
        id: uuidv4(),
        items: data.items.map(i => ({...i, id: i.id || uuidv4()})),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: user.uid,
        updatedBy: user.uid,
      };
      addPurchase(newPurchase);

      if (data.status === "Received") {
        for (const item of data.items) {
          const fp = products.find(p => p.id === item.productId);
          if (fp) {
            await ProductService.updateProduct(
              fp.id,
              { 
                quantity: (fp.quantity || 0) + item.orderedQuantity,
                costPrice: item.unitCost
              },
              user.uid, user.displayName ?? "System"
            );
          }
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          {initialData ? t("purchases.form.editTitle") : t("purchases.form.createTitle")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("purchases.form.supplierName")}</label>
            <input
              {...register("supplierName")}
              className={inputCls}
              placeholder={t("purchases.form.supplierPlaceholder")}
            />
            {errors.supplierName && <span className="text-xs text-destructive">{errors.supplierName.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("purchases.form.purchaseDate")}</label>
            <input
              type="date"
              value={new Date(watch("purchaseDate") || Date.now()).toISOString().substring(0,10)}
              onChange={(e) => setValue("purchaseDate", new Date(e.target.value).getTime())}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("purchases.form.status")}</label>
            <select {...register("status")} className={inputCls}>
              <option value="Draft">📝 Draft</option>
              <option value="Pending">⏳ {t("purchases.statuses.Pending")}</option>
              <option value="PartiallyReceived">📦 Partially Received</option>
              <option value="Received">✅ {t("purchases.statuses.Received")}</option>
              <option value="Cancelled">❌ {t("purchases.statuses.Cancelled")}</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-semibold">{t("purchases.form.productDetails")}</h3>
          <button
            type="button"
            onClick={() => append({ productId: "", sku: "", name: "", orderedQuantity: 1, receivedQuantity: 0, unitCost: 0 })}
            className="flex items-center gap-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus size={16} />
            إضافة صنف
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
                
                <div className="md:col-span-5 relative">
                  <label className="block text-sm font-medium mb-1">{t("purchases.form.product")} {index + 1}</label>
                  <input
                    type="text"
                    value={currentSearch}
                    placeholder={t("purchases.form.searchProduct")}
                    onChange={(e) => { 
                      setProductSearch(prev => ({ ...prev, [index]: e.target.value })); 
                      setOpenDropdownIndex(index); 
                    }}
                    onFocus={() => setOpenDropdownIndex(index)}
                    className={inputCls}
                    autoComplete="off"
                  />
                  {openDropdownIndex === index && (
                    <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border bg-popover shadow-lg">
                      {filteredProducts.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No products found</div>
                      ) : (
                        filteredProducts.map(p => (
                          <button
                            key={p.sku}
                            type="button"
                            onClick={() => handleSelectProduct(index, p)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex justify-between items-center"
                          >
                            <span className="font-medium">{p.productName}</span>
                            <span className="text-xs text-muted-foreground ml-2 font-mono">
                              {p.sku} · Stock: {p.quantity}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <input type="hidden" {...register(`items.${index}.productId`)} />
                  <input type="hidden" {...register(`items.${index}.sku`)} />
                  <input type="hidden" {...register(`items.${index}.name`)} />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">{t("purchases.form.quantity")}</label>
                  <input
                    type="number"
                    min={1}
                    {...register(`items.${index}.orderedQuantity`, { valueAsNumber: true })}
                    className={inputCls}
                  />
                  {errors.items?.[index]?.orderedQuantity && <span className="text-xs text-destructive">{errors.items[index].orderedQuantity.message}</span>}
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">{t("purchases.form.unitCost")}</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    {...register(`items.${index}.unitCost`, { valueAsNumber: true })}
                    className={inputCls}
                  />
                </div>

                <div className="md:col-span-1 flex items-end justify-center pb-2 h-full">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">{t("purchases.form.financials")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border">
            <h4 className="font-medium">{t("purchases.form.additionalExpenses")}</h4>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t("purchases.form.shippingFreight")}</label>
              <input type="number" step="0.01" min={0} {...register("shippingCost", { valueAsNumber: true })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Tax</label>
              <input type="number" step="0.01" min={0} {...register("tax", { valueAsNumber: true })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t("purchases.form.otherCustoms")}</label>
              <input type="number" step="0.01" min={0} {...register("otherExpenses", { valueAsNumber: true })} className={inputCls} />
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col justify-center p-6 bg-primary/5 rounded-lg border border-primary/20 items-center">
            <p className="text-sm text-muted-foreground mb-1">{t("purchases.form.totalPurchaseCost")}</p>
            <div className="text-5xl font-bold tracking-tight text-primary">
              {Number(totalCost || 0).toFixed(2)} {currency}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Items ({watchedItems.reduce((acc, item) => acc + (Number(item.orderedQuantity) || 0), 0)} Total) + Shipping + Tax + Expenses
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onSuccess}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-10 px-4">
          {t("purchases.form.cancel")}
        </button>
        <button type="submit" disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 disabled:opacity-50">
          {isSubmitting ? t("purchases.form.saving") : initialData ? t("purchases.form.update") : t("purchases.form.save")}
        </button>
      </div>
    </form>
  );
}
