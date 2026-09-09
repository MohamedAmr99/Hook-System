import React, { useState } from "react";
import { Pencil, Trash2, Plus, Monitor, Tag, Percent } from "lucide-react";
import { usePlatforms, useCreatePlatform, useUpdatePlatform, useDeletePlatform } from "../hooks/usePlatforms";
import { useCategories } from "../hooks/useCategories";
import type { Platform, PlatformCategory } from "../types/platform.types";

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PlatformListPage() {
  const { data: platforms = [], isLoading } = usePlatforms();
  const { data: categories = [] } = useCategories();
  const createPlatform = useCreatePlatform();
  const updatePlatform = useUpdatePlatform();
  const deletePlatform = useDeletePlatform();

  const [showForm, setShowForm] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [platformName, setPlatformName] = useState("");
  const [platformCategories, setPlatformCategories] = useState<PlatformCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [commissionRate, setCommissionRate] = useState<number>(0);

  const handleOpenCreate = () => {
    setEditingPlatform(null);
    setPlatformName("");
    setPlatformCategories([]);
    setSelectedCatId("");
    setCommissionRate(0);
    setShowForm(true);
  };

  const handleOpenEdit = (platform: Platform) => {
    setEditingPlatform(platform);
    setPlatformName(platform.name);
    setPlatformCategories(platform.categories || []);
    setSelectedCatId("");
    setCommissionRate(0);
    setShowForm(true);
  };

  const handleAddCategory = () => {
    if (!selectedCatId) return;
    const cat = categories.find(c => c.id === selectedCatId);
    if (!cat) return;
    // prevent duplicates
    if (platformCategories.find(pc => pc.categoryId === selectedCatId)) return;
    setPlatformCategories(prev => [
      ...prev,
      { categoryId: cat.id, categoryName: cat.name, commissionRate },
    ]);
    setSelectedCatId("");
    setCommissionRate(0);
  };

  const handleRemoveCategory = (catId: string) => {
    setPlatformCategories(prev => prev.filter(pc => pc.categoryId !== catId));
  };

  const handleUpdateCommission = (catId: string, rate: number) => {
    setPlatformCategories(prev =>
      prev.map(pc => pc.categoryId === catId ? { ...pc, commissionRate: rate } : pc)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformName.trim()) return;

    const data = { name: platformName, logoUrl: "", categories: platformCategories };

    if (editingPlatform) {
      await updatePlatform.mutateAsync({ id: editingPlatform.id, data });
    } else {
      await createPlatform.mutateAsync(data);
    }
    setShowForm(false);
  };

  const handleDelete = async (platform: Platform) => {
    if (!window.confirm(`هل أنت متأكد من حذف منصة "${platform.name}"؟`)) return;
    await deletePlatform.mutateAsync(platform.id);
  };

  const availableCategories = categories.filter(
    c => !platformCategories.find(pc => pc.categoryId === c.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المنصات</h1>
          <p className="text-muted-foreground text-sm">إدارة المنصات والفئات والعمولات الخاصة بكل منصة</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 rounded-md text-sm font-medium"
        >
          <Plus size={16} />
          إضافة منصة
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">
              {editingPlatform ? `تعديل: ${editingPlatform.name}` : "إضافة منصة جديدة"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Platform name */}
              <div>
                <label className="block text-sm font-medium mb-1">اسم المنصة *</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={e => setPlatformName(e.target.value)}
                  placeholder="مثال: Amazon, Noon, Jumia..."
                  className={inputCls}
                  required
                  autoFocus
                />
              </div>

              {/* Add category to platform */}
              <div className="border rounded-lg p-4 space-y-3 bg-secondary/10">
                <h3 className="font-semibold text-sm">ربط الفئات بهذه المنصة</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">الفئة</label>
                    <select
                      value={selectedCatId}
                      onChange={e => setSelectedCatId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">-- اختر فئة --</option>
                      {availableCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-xs text-amber-500 mt-1">لا توجد فئات — أضف فئات من صفحة الفئات أولاً.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">نسبة العمولة (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={commissionRate}
                      onChange={e => setCommissionRate(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!selectedCatId}
                  className="flex items-center gap-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors"
                >
                  <Plus size={15} />
                  إضافة الفئة للمنصة
                </button>
              </div>

              {/* Platform categories table */}
              {platformCategories.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-2.5 text-start font-medium text-muted-foreground">الفئة</th>
                        <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">نسبة العمولة</th>
                        <th className="px-4 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {platformCategories.map(pc => (
                        <tr key={pc.categoryId} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <Tag size={13} className="text-muted-foreground" />
                              <span>{pc.categoryName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.1"
                                min={0}
                                max={100}
                                value={pc.commissionRate}
                                onChange={e => handleUpdateCommission(pc.categoryId, Number(e.target.value))}
                                className="h-8 w-20 rounded-md border text-center text-sm px-2 bg-background"
                              />
                              <Percent size={13} className="text-muted-foreground" />
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(pc.categoryId)}
                              className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createPlatform.isPending || updatePlatform.isPending}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {createPlatform.isPending || updatePlatform.isPending ? "جاري الحفظ..." : "حفظ المنصة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">عدد المنصات</p>
          <p className="text-2xl font-bold mt-1 text-primary">{platforms.length}</p>
        </div>
      </div>

      {/* Platform cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          جاري التحميل...
        </div>
      ) : platforms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
          <Monitor size={40} className="opacity-30" />
          <p>لا توجد منصات حتى الآن</p>
          <button onClick={handleOpenCreate} className="text-primary hover:underline text-sm">
            إضافة أول منصة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {platforms.map(platform => (
            <div key={platform.id} className="bg-card border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Monitor size={18} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-base">{platform.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEdit(platform)}
                    className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(platform)}
                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {platform.categories.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    الفئات والعمولات
                  </p>
                  <div className="space-y-1.5">
                    {platform.categories.map(pc => (
                      <div key={pc.categoryId} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Tag size={12} className="text-muted-foreground" />
                          <span className="text-sm">{pc.categoryName}</span>
                        </div>
                        <span className="text-sm font-semibold text-primary flex items-center gap-0.5">
                          {pc.commissionRate}
                          <Percent size={11} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">لا توجد فئات مضافة</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
