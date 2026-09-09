import React, { useState } from "react";
import { Pencil, Trash2, Plus, Tags, ChevronDown, ChevronUp } from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../hooks/useCategories";
import type { Category } from "../types/platform.types";

export function CategoryListPage() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setShowForm(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description || "" });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, data: formData });
    } else {
      await createCategory.mutateAsync(formData);
    }
    setShowForm(false);
    setFormData({ name: "", description: "" });
    setEditingCategory(null);
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`هل أنت متأكد من حذف الفئة "${cat.name}"؟`)) return;
    await deleteCategory.mutateAsync(cat.id);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الفئات</h1>
          <p className="text-muted-foreground text-sm">إدارة تصنيفات المنتجات المستخدمة في المنصات والمنتجات</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 rounded-md text-sm font-medium"
        >
          <Plus size={16} />
          إضافة فئة
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold">
              {editingCategory ? `تعديل: ${editingCategory.name}` : "إضافة فئة جديدة"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">اسم الفئة *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: إلكترونيات، ملابس، أجهزة منزلية..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الوصف (اختياري)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر للفئة..."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createCategory.isPending || updateCategory.isPending}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {createCategory.isPending || updateCategory.isPending ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">إجمالي الفئات</p>
          <p className="text-2xl font-bold mt-1 text-primary">{categories.length}</p>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          جاري التحميل...
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
          <Tags size={40} className="opacity-30" />
          <p>لا توجد فئات حتى الآن</p>
          <button
            onClick={handleOpenCreate}
            className="text-primary hover:underline text-sm"
          >
            إضافة أول فئة
          </button>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="divide-y">
            {categories.map(cat => (
              <div key={cat.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Tags size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{cat.name}</p>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground truncate">{cat.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {cat.description && (
                      <button
                        onClick={() => toggleExpand(cat.id)}
                        className="p-2 rounded-md text-muted-foreground hover:bg-accent"
                      >
                        {expandedIds.has(cat.id) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-2 rounded-md text-primary hover:bg-primary/10"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-2 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {expandedIds.has(cat.id) && cat.description && (
                  <div className="mt-3 ps-12 text-sm text-muted-foreground">
                    {cat.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
