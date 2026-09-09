import * as React from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productSchema,
  type ProductFormValues,
} from "../schemas/product.schema";
import { ProductFormSection } from "./ProductFormSection";
import { UploadZone } from "@/shared/components/UploadZone";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Loader2,
  Globe,
  DollarSign,
  Box,
  Image as ImageIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useCategories } from "@/features/platforms/hooks/useCategories";

import { toast } from "sonner";

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: ProductFormValues) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
}

type TabType =
  | "general"
  | "inventory"
  | "marketplaces"
  | "seo"
  | "media";

export function ProductForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  onCancel,
}: ProductFormProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<TabType>("general");
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);
  const { data: categories = [] } = useCategories();

  // Local reusable CategoryDropdown component
  function CategoryDropdown({
    label,
    value,
    onChange,
    error,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    error?: string;
  }) {
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            error && "border-destructive"
          )}
        >
          <option value="">-- اختر الفئة --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
        {error && <p className="text-[10px] text-destructive font-medium">{error}</p>}
        {categories.length === 0 && (
          <p className="text-[10px] text-amber-500">
            لا توجد فئات — أضف فئات من صفحة الفئات أولاً.
          </p>
        )}
      </div>
    );
  }

  const methods = useForm<ProductFormValues, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData || {
      productName: "",
      slug: "",
      sku: "",
      barcode: "",
      brand: "",
      category: "",
      subcategory: "",
      description: "",
      sellingPrice: 0,
      quantity: 0,
      reservedQuantity: 0,
      minimumStockAlert: 5,
      amazonStatus: "Inactive",
      noonStatus: "Inactive",
      jumiaStatus: "Inactive",
      listingUrls: {
        amazon: "",
        noon: "",
        jumia: "",
      },
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      aiPrompt: "",
      aiGeneratedDescription: "",
      thumbnail: "",
      gallery: [],
      videos: [],
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  const productName = watch("productName");

  // Auto-generate slug from product name
  React.useEffect(() => {
    if (productName && !initialData) {
      const generatedSlug = productName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // remove invalid characters
        .trim()
        .replace(/\s+/g, "-") // replace spaces with hyphens
        .replace(/-+/g, "-"); // remove duplicates
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [productName, setValue, initialData]);

  // AI copywriting generator simulator
  const handleAIGenerate = () => {
    const name = watch("productName");
    const category = watch("category");
    const prompt = watch("aiPrompt");

    if (!name) {
      alert("الرجاء إدخال اسم المنتج أولاً لتوليد وصف تسويقي.");
      return;
    }

    setIsGeneratingAI(true);
    setTimeout(() => {
      const brandName = watch("brand") || "علامة تجارية مميزة";
      const generatedText = `نقدم لكم ${name} الجديد كلياً من ${brandName}. صُمم هذا الـ ${category || "منتج"} ليقدم أداءً استثنائياً وجودة فائقة تمثل قمة التصميم الحديث. بفضل متانته العالية ومكوناته المصممة هندسياً بدقة، تم تصميمه خصيصاً لتقديم أفضل النتائج. ${prompt ? `محسّن لـ: ${prompt}.` : ""}\n\nتشمل الميزات الرئيسية مواد عالية الجودة، تصميم مريح، وتوافق تام مع الأنظمة القياسية. ارتقِ بتجربتك اليوم مع ${name}.`;

      setValue("aiGeneratedDescription", generatedText);
      setValue("description", generatedText); // Sync to main description
      setIsGeneratingAI(false);
    }, 1500);
  };

  const tabs: { value: TabType; label: string; icon: React.ReactNode }[] = [
    {
      value: "general",
      label: t("products.form.tabs.general"),
      icon: <Box size={14} />,
    },
    {
      value: "inventory",
      label: t("products.form.tabs.inventory"),
      icon: <CheckCircle2 size={14} />,
    },
    {
      value: "marketplaces",
      label: t("products.form.tabs.marketplaces"),
      icon: <Globe size={14} />,
    },
    {
      value: "seo",
      label: t("products.form.tabs.seo"),
      icon: <Sparkles size={14} />,
    },
    {
      value: "media",
      label: t("products.form.tabs.media"),
      icon: <ImageIcon size={14} />,
    },
  ];

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast.error("يرجى مراجعة الحقول المطلوبة (توجد بيانات ناقصة أو غير صحيحة)");
    
    // Auto-switch to the first tab that has an error
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstError = errorKeys[0];
      if (["productName", "slug", "sku", "barcode", "brand", "category", "subcategory", "sellingPrice", "costPrice", "description"].includes(firstError)) {
        setActiveTab("general");
      } else if (["quantity", "reservedQuantity", "minimumStockAlert"].includes(firstError)) {
        setActiveTab("inventory");
      } else if (["amazonStatus", "noonStatus", "jumiaStatus", "listingUrls"].includes(firstError)) {
        setActiveTab("marketplaces");
      } else if (["metaTitle", "metaDescription", "keywords"].includes(firstError)) {
        setActiveTab("seo");
      } else if (["thumbnail", "gallery"].includes(firstError)) {
        setActiveTab("media");
      }
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        className="space-y-6 max-w-5xl mx-auto"
      >
        {/* Form Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {initialData
                ? `${t("products.form.edit")} ${initialData.productName}`
                : t("products.form.create")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("products.form.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-9 px-4"
            >
              {t("products.form.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-6 bg-primary text-primary-foreground font-semibold shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t("products.form.saving")}</span>
                </>
              ) : (
                <span>{t("products.form.save")}</span>
              )}
            </Button>
          </div>
        </div>

        {/* Form Body - Split Sidebar Navigation + Content Tabs */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Tab Navigation */}
          <aside className="w-full lg:w-64 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 border-b lg:border-b-0 lg:border-r border-border pb-3 lg:pb-0 lg:pr-4 flex-shrink-0 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap text-left transition-all duration-200",
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </aside>

          {/* Form Content */}
          <div className="flex-1 w-full space-y-6">
            {/* General Info Tab */}
            {activeTab === "general" && (
              <ProductFormSection
                title={t("products.form.sections.basicInfo.title")}
                description={t("products.form.sections.basicInfo.desc")}
              >
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="productName">
                    {t("products.form.fields.productName")}
                  </Label>
                  <Input
                    id="productName"
                    placeholder="e.g. Ergonomic Office Desk Chair"
                    {...register("productName")}
                    className={cn(
                      errors.productName &&
                        "border-destructive focus-visible:ring-destructive/30",
                    )}
                  />
                  {errors.productName && (
                    <p className="text-[10px] text-destructive font-medium">
                      {errors.productName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="slug">{t("products.form.fields.slug")}</Label>
                  <Input
                    id="slug"
                    placeholder="e.g. ergonomic-office-desk-chair"
                    {...register("slug")}
                    className={cn(
                      errors.slug &&
                        "border-destructive focus-visible:ring-destructive/30",
                    )}
                  />
                  {errors.slug && (
                    <p className="text-[10px] text-destructive font-medium">
                      {errors.slug.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sku">{t("products.form.fields.sku")}</Label>
                  <Input
                    id="sku"
                    placeholder="e.g. OFF-CHR-001"
                    {...register("sku")}
                    className={cn(
                      errors.sku &&
                        "border-destructive focus-visible:ring-destructive/30",
                    )}
                  />
                  {errors.sku && (
                    <p className="text-[10px] text-destructive font-medium">
                      {errors.sku.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="barcode">
                    {t("products.form.fields.barcode")}
                  </Label>
                  <Input
                    id="barcode"
                    placeholder="e.g. 501234567890"
                    {...register("barcode")}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="brand">
                    {t("products.form.fields.brand")}
                  </Label>
                  <Input
                    id="brand"
                    placeholder="e.g. Steelcase"
                    {...register("brand")}
                    className={cn(
                      errors.brand &&
                        "border-destructive focus-visible:ring-destructive/30",
                    )}
                  />
                  {errors.brand && (
                    <p className="text-[10px] text-destructive font-medium">
                      {errors.brand.message}
                    </p>
                  )}
                </div>

                <CategoryDropdown
                  label={t("products.form.fields.category")}
                  value={methods.watch("category") ?? ""}
                  onChange={val => methods.setValue("category", val, { shouldValidate: true })}
                  error={errors.category?.message}
                />

                <div className="space-y-1">
                  <Label htmlFor="subcategory">
                    {t("products.form.fields.subcategory")}
                  </Label>
                  <Input
                    id="subcategory"
                    placeholder="e.g. Chairs"
                    {...register("subcategory")}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sellingPrice">
                    {t("products.form.fields.sellingPrice")}
                  </Label>
                  <div className="relative">
                    <DollarSign
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      {...register("sellingPrice")}
                      className={cn(
                        "pl-8",
                        errors.sellingPrice && "border-destructive",
                      )}
                    />
                  </div>
                  {errors.sellingPrice && (
                    <p className="text-[10px] text-destructive font-medium">
                      {errors.sellingPrice.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="costPrice">
                    سعر الجملة (التكلفة)
                  </Label>
                  <div className="relative">
                    <DollarSign
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      {...register("costPrice")}
                      readOnly
                      className="pl-8 bg-muted cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    يتم تحديثه تلقائياً بآخر سعر من أوامر الشراء المستلمة.
                  </p>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="description">
                    {t("products.form.fields.description")}
                  </Label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="..."
                    {...register("description")}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </ProductFormSection>
            )}

            {/* Inventory Tab */}
            {activeTab === "inventory" && (
              <ProductFormSection
                title={t("products.form.sections.inventoryControls.title")}
                description={t("products.form.sections.inventoryControls.desc")}
              >
                <div className="space-y-1">
                  <Label htmlFor="quantity">
                    {t("products.form.fields.quantity")}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    {...register("quantity")}
                    className={cn(errors.quantity && "border-destructive")}
                  />
                  {errors.quantity && (
                    <p className="text-[10px] text-destructive font-medium">
                      {errors.quantity.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reservedQuantity">
                    {t("products.form.fields.reservedQuantity")}
                  </Label>
                  <Input
                    id="reservedQuantity"
                    type="number"
                    {...register("reservedQuantity")}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="minimumStockAlert">
                    {t("products.form.fields.minimumStockAlert")}
                  </Label>
                  <Input
                    id="minimumStockAlert"
                    type="number"
                    {...register("minimumStockAlert")}
                  />
                </div>
              </ProductFormSection>
            )}

            {/* Marketplaces Tab */}
            {activeTab === "marketplaces" && (
              <div className="space-y-6">
                <ProductFormSection
                  title={t("products.form.sections.channelSync.title")}
                  description={t("products.form.sections.channelSync.desc")}
                >
                  <div className="space-y-1">
                    <Label htmlFor="amazonStatus">
                      {t("products.form.fields.amazonStatus")}
                    </Label>
                    <Controller
                      name="amazonStatus"
                      control={methods.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inactive">
                              {t("products.status.inactive")}
                            </SelectItem>
                            <SelectItem value="Active">
                              {t("products.status.active")}
                            </SelectItem>
                            <SelectItem value="Pending">
                              {t("products.status.pending")}
                            </SelectItem>
                            <SelectItem value="Suspended">
                              {t("products.status.suspended")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="noonStatus">
                      {t("products.form.fields.noonStatus")}
                    </Label>
                    <Controller
                      name="noonStatus"
                      control={methods.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inactive">
                              {t("products.status.inactive")}
                            </SelectItem>
                            <SelectItem value="Active">
                              {t("products.status.active")}
                            </SelectItem>
                            <SelectItem value="Pending">
                              {t("products.status.pending")}
                            </SelectItem>
                            <SelectItem value="Suspended">
                              {t("products.status.suspended")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="jumiaStatus">
                      {t("products.form.fields.jumiaStatus")}
                    </Label>
                    <Controller
                      name="jumiaStatus"
                      control={methods.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inactive">
                              {t("products.status.inactive")}
                            </SelectItem>
                            <SelectItem value="Active">
                              {t("products.status.active")}
                            </SelectItem>
                            <SelectItem value="Pending">
                              {t("products.status.pending")}
                            </SelectItem>
                            <SelectItem value="Suspended">
                              {t("products.status.suspended")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </ProductFormSection>

                <ProductFormSection
                  title={t("products.form.sections.listingMapping.title")}
                  description={t("products.form.sections.listingMapping.desc")}
                >
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="listingUrls.amazon">
                      {t("products.form.fields.amazonUrl")}
                    </Label>
                    <Input
                      id="listingUrls.amazon"
                      placeholder="https://amazon.com/dp/ASIN..."
                      {...register("listingUrls.amazon")}
                      className={cn(
                        errors.listingUrls?.amazon && "border-destructive",
                      )}
                    />
                    {errors.listingUrls?.amazon && (
                      <p className="text-[10px] text-destructive font-medium">
                        {errors.listingUrls.amazon.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="listingUrls.noon">
                      {t("products.form.fields.noonUrl")}
                    </Label>
                    <Input
                      id="listingUrls.noon"
                      placeholder="https://noon.com/product/..."
                      {...register("listingUrls.noon")}
                      className={cn(
                        errors.listingUrls?.noon && "border-destructive",
                      )}
                    />
                    {errors.listingUrls?.noon && (
                      <p className="text-[10px] text-destructive font-medium">
                        {errors.listingUrls.noon.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="listingUrls.jumia">
                      {t("products.form.fields.jumiaUrl")}
                    </Label>
                    <Input
                      id="listingUrls.jumia"
                      placeholder="https://jumia.com.eg/..."
                      {...register("listingUrls.jumia")}
                      className={cn(
                        errors.listingUrls?.jumia && "border-destructive",
                      )}
                    />
                    {errors.listingUrls?.jumia && (
                      <p className="text-[10px] text-destructive font-medium">
                        {errors.listingUrls.jumia.message}
                      </p>
                    )}
                  </div>
                </ProductFormSection>
              </div>
            )}

            {/* SEO & AI Tab */}
            {activeTab === "seo" && (
              <div className="space-y-6">
                <ProductFormSection
                  title={t("products.form.sections.seoConfig.title")}
                  description={t("products.form.sections.seoConfig.desc")}
                >
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="metaTitle">
                      {t("products.form.fields.metaTitle")}
                    </Label>
                    <Input
                      id="metaTitle"
                      placeholder="Steelcase Ergonomic Office Chair - Premium Comfort"
                      {...register("metaTitle")}
                      className={cn(errors.metaTitle && "border-destructive")}
                    />
                    {errors.metaTitle && (
                      <p className="text-[10px] text-destructive font-medium">
                        {errors.metaTitle.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="metaDescription">
                      {t("products.form.fields.metaDescription")}
                    </Label>
                    <textarea
                      id="metaDescription"
                      rows={3}
                      placeholder="..."
                      {...register("metaDescription")}
                      className={cn(
                        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        errors.metaDescription && "border-destructive",
                      )}
                    />
                    {errors.metaDescription && (
                      <p className="text-[10px] text-destructive font-medium">
                        {errors.metaDescription.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="keywords">
                      {t("products.form.fields.keywords")}
                    </Label>
                    <Input
                      id="keywords"
                      placeholder="office chair, ergonomic furniture, steelcase, desk chair"
                      {...register("keywords")}
                    />
                  </div>
                </ProductFormSection>

                {/* AI Content System */}
                <ProductFormSection
                  title={t("products.form.sections.aiCopywriter.title")}
                  description={t("products.form.sections.aiCopywriter.desc")}
                >
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="aiPrompt">
                      {t("products.form.fields.aiPrompt")}
                    </Label>
                    <Input
                      id="aiPrompt"
                      placeholder="..."
                      {...register("aiPrompt")}
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <Button
                      type="button"
                      disabled={isGeneratingAI}
                      onClick={handleAIGenerate}
                      className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs h-9 px-4 flex items-center gap-2 group transition-all"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>{t("products.form.buttons.generating")}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles
                            size={14}
                            className="group-hover:scale-125 transition-transform"
                          />
                          <span>{t("products.form.buttons.generateCopy")}</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="aiGeneratedDescription">
                      {t("products.form.fields.aiGenerated")}
                    </Label>
                    <textarea
                      id="aiGeneratedDescription"
                      rows={5}
                      readOnly
                      placeholder="..."
                      {...register("aiGeneratedDescription")}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm shadow-sm focus:outline-none select-text cursor-default"
                    />
                  </div>
                </ProductFormSection>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === "media" && (
              <div className="space-y-6">
                <ProductFormSection
                  title={t("products.form.sections.mainThumbnail.title")}
                  description={t("products.form.sections.mainThumbnail.desc")}
                >
                  <div className="md:col-span-2">
                    <UploadZone
                      maxFiles={1}
                      label={t("products.form.buttons.uploadThumbnail")}
                      existingUrls={
                        watch("thumbnail") ? [watch("thumbnail")!] : []
                      }
                      onUploadComplete={(urls) => {
                        if (urls.length > 0) {
                          setValue("thumbnail", urls[0], {
                            shouldValidate: true,
                          });
                        }
                      }}
                      onRemove={() => {
                        setValue("thumbnail", "", { shouldValidate: true });
                      }}
                    />
                  </div>
                </ProductFormSection>

                <ProductFormSection
                  title={t("products.form.sections.gallery.title")}
                  description={t("products.form.sections.gallery.desc")}
                >
                  <div className="md:col-span-2">
                    <UploadZone
                      maxFiles={5}
                      label={t("products.form.buttons.uploadGallery")}
                      existingUrls={watch("gallery") || []}
                      onUploadComplete={(urls) => {
                        const current = watch("gallery") || [];
                        setValue("gallery", [...current, ...urls], {
                          shouldValidate: true,
                        });
                      }}
                      onRemove={(urlToRemove) => {
                        const current = watch("gallery") || [];
                        setValue(
                          "gallery",
                          current.filter((url) => url !== urlToRemove),
                          { shouldValidate: true },
                        );
                      }}
                    />
                  </div>
                </ProductFormSection>
              </div>
            )}
          </div>
        </div>

        {/* Step Buttons at bottom */}
        <div className="flex justify-between items-center border-t border-border/50 pt-5 mt-6">
          <Button
            type="button"
            variant="outline"
            disabled={activeTab === "general"}
            onClick={() => {
              const tabOrder: TabType[] = [
                "general",
                "inventory",
                "marketplaces",
                "seo",
                "media",
              ];
              const currentIndex = tabOrder.indexOf(activeTab);
              if (currentIndex > 0) setActiveTab(tabOrder[currentIndex - 1]);
            }}
            className="h-9 gap-1.5"
          >
            <ChevronLeft size={16} />
            <span>{t("products.form.buttons.previous")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={activeTab === "media"}
            onClick={() => {
              const tabOrder: TabType[] = [
                "general",
                "inventory",
                "marketplaces",
                "seo",
                "media",
              ];
              const currentIndex = tabOrder.indexOf(activeTab);
              if (currentIndex < tabOrder.length - 1)
                setActiveTab(tabOrder[currentIndex + 1]);
            }}
            className="h-9 gap-1.5"
          >
            <span>{t("products.form.buttons.next")}</span>
            <ChevronRight size={16} />
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
