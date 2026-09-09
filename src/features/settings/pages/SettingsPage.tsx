import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store/settings.store";
import { useCategories } from "@/features/platforms/hooks/useCategories";
import { Button } from "@/shared/components/ui/button";
import { Save } from "lucide-react";

export function SettingsPage() {
  const { t } = useTranslation();
  const { settings, fetchSettings, updateSettings, isLoading } = useSettingsStore();
  const { data: categories = [] } = useCategories();

  const [globalVat, setGlobalVat] = useState(14);
  const [categoryVats, setCategoryVats] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setGlobalVat(settings.tax.globalVatRate);
      setCategoryVats(settings.tax.categoryVatRates || {});
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({
      tax: {
        globalVatRate: globalVat,
        categoryVatRates: categoryVats
      }
    });
    alert(t("settings.saved", "Settings saved successfully!"));
  };

  const handleCategoryVatChange = (categoryId: string, val: string) => {
    const num = parseFloat(val);
    setCategoryVats(prev => ({
      ...prev,
      [categoryId]: isNaN(num) ? 0 : num
    }));
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings.title", "Settings")}</h1>
        <p className="text-muted-foreground">{t("settings.subtitle", "Manage global configuration and taxes.")}</p>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-medium border-b pb-2 mb-4">{t("settings.tax.title", "Tax & VAT Configuration")}</h3>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t("settings.tax.globalVat", "Global VAT Rate (%)")}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={globalVat}
                onChange={(e) => setGlobalVat(parseFloat(e.target.value) || 0)}
                className="flex h-10 w-full md:w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.tax.globalVatHelp", "This default rate is applied to products unless overridden by a category setting.")}
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <label className="text-sm font-medium">{t("settings.tax.categoryVat", "Category Specific VAT Rates (%)")}</label>
              
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No categories found.</p>
              ) : (
                <div className="grid gap-3">
                  {categories.map((cat: any) => (
                    <div key={cat.id} className="flex items-center gap-4">
                      <span className="w-1/3 text-sm font-medium">{cat.name}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder={String(globalVat)}
                        value={categoryVats[cat.id] ?? ""}
                        onChange={(e) => handleCategoryVatChange(cat.id, e.target.value)}
                        className="flex h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="gap-2">
            <Save size={16} />
            {t("common.save", "Save Changes")}
          </Button>
        </div>
      </div>
    </div>
  );
}
