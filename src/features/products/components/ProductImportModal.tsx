import { useState, useRef } from "react";
import { UploadCloud, Download, X, AlertCircle, CheckCircle2, Eye } from "lucide-react";
import { useCreateProductMutation } from "../hooks/useProducts";
import { Product } from "../types/product.types";
import { Button } from "@/shared/components/ui/button";

interface ProductImportModalProps {
  onClose: () => void;
}

const TEMPLATE_HEADERS = [
  "productName", "sku", "barcode", "brand", "category", "subcategory",
  "sellingPrice", "costPrice", "quantity", "minimumStockAlert"
];

function parseDelimited(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes("\t") ? "\t" : ",";

  function splitLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim()); current = "";
      } else { current += ch; }
    }
    result.push(current.trim());
    return result;
  }

  const headers = splitLine(lines[0]);
  const results: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    if (values.every(v => v === "")) continue;
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => { rowObj[h] = values[idx] ?? ""; });
    results.push(rowObj);
  }
  return results;
}

function mapRowToProduct(row: Record<string, string>) {
  const name = row["\u0627\u0633\u0645-\u0627\u0644\u0645\u0646\u062a\u062c"] || row["item-name"] || row["product-name"] || row["productName"] || "";
  const sku  = row["sku-\u0627\u0644\u0628\u0627\u0626\u0639"]  || row["seller-sku"] || row["sku"] || "";
  const barcode = row["asin1"] || row["barcode"] || "";
  const brand = row["brand"] || row["brand-name"] || "";
  const category = row["zshop-category1"] || row["category"] || "";
  const description = row["\u0648\u0635\u0641-\u0627\u0644\u0645\u0646\u062a\u062c"] || row["item-description"] || row["description"] || "";
  const sellingPrice = parseFloat(row["\u0627\u0644\u0633\u0639\u0631"] || row["price"] || row["sellingPrice"] || "0") || 0;
  const costPrice    = parseFloat(row["costPrice"] || row["cost-price"] || "0") || 0;
  const quantity = parseInt(row["\u0627\u0644\u0643\u0645\u064a\u0629"] || row["quantity"] || row["available"] || "0", 10) || 0;
  const minimumStockAlert = parseInt(row["minimumStockAlert"] || row["min-stock"] || "5", 10) || 5;
  return { name, sku, barcode, brand, category, description, sellingPrice, costPrice, quantity, minimumStockAlert };
}

interface PreviewRow {
  name: string; sku: string; sellingPrice: number; quantity: number; valid: boolean; reason?: string;
}

export function ProductImportModal({ onClose }: ProductImportModalProps) {
  const { mutateAsync: createProduct } = useCreateProductMutation();
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + TEMPLATE_HEADERS.join(",") + "\n";
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "products_template.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null); setSuccessCount(null); setPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseDelimited(text);
        if (rows.length === 0) { setError("\u0627\u0644\u0645\u0644\u0641 \u0641\u0627\u0631\u063a \u0623\u0648 \u0644\u0627 \u064a\u062d\u062a\u0648\u064a \u0639\u0644\u0649 \u0628\u064a\u0627\u0646\u0627\u062a \u0635\u062d\u064a\u062d\u0629."); return; }
        const previewRows: PreviewRow[] = rows.slice(0, 200).map(row => {
          const mapped = mapRowToProduct(row);
          const valid = !!(mapped.name && mapped.sku);
          return { name: mapped.name || "(\u0628\u062f\u0648\u0646 \u0627\u0633\u0645)", sku: mapped.sku || "(\u0628\u062f\u0648\u0646 SKU)", sellingPrice: mapped.sellingPrice, quantity: mapped.quantity, valid, reason: !mapped.name ? "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062a\u062c \u0645\u0641\u0642\u0648\u062f" : !mapped.sku ? "SKU \u0645\u0641\u0642\u0648\u062f" : undefined };
        });
        setRawRows(rows.slice(0, 200)); setPreview(previewRows);
      } catch (err) { setError("\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0645\u0644\u0641."); console.error(err); }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (!rawRows.length) return;
    setIsImporting(true); setError(null);
    const validRows = rawRows.map(mapRowToProduct).filter(r => r.name && r.sku);
    if (validRows.length === 0) { setError("\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0646\u062a\u062c\u0627\u062a \u0635\u0627\u0644\u062d\u0629."); setIsImporting(false); return; }
    try {
      await Promise.all(validRows.map(r => {
        const newProduct: Omit<Product, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "archived"> = {
          productName: r.name, slug: r.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
          sku: r.sku, barcode: r.barcode, brand: r.brand, category: r.category, subcategory: "",
          description: r.description, sellingPrice: r.sellingPrice, costPrice: r.costPrice,
          quantity: r.quantity, reservedQuantity: 0, minimumStockAlert: r.minimumStockAlert,
          amazonStatus: "Inactive", noonStatus: "Inactive", jumiaStatus: "Inactive", listingUrls: {},
          metaTitle: r.name, metaDescription: "", keywords: "", aiPrompt: "", aiGeneratedDescription: "",
          gallery: [], videos: [],
        };
        return createProduct(newProduct);
      }));
      setSuccessCount(validRows.length);
      setTimeout(() => onClose(), 2500);
    } catch (err: any) { setError(err.message || "\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u0631\u0641\u0639."); }
    finally { setIsImporting(false); }
  };

  const validCount = preview?.filter(r => r.valid).length ?? 0;
  const invalidCount = preview ? preview.length - validCount : 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <UploadCloud size={18} className="text-primary" />
            {"\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0645\u0646\u062a\u062c\u0627\u062a \u0628\u0627\u0644\u062c\u0645\u0644\u0629"}
          </h2>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {successCount !== null ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 size={52} className="text-emerald-500" />
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{"\u062a\u0645 \u0627\u0644\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0628\u0646\u062c\u0627\u062d!"}</p>
              <p className="text-sm text-muted-foreground">{"\u062a\u0645 \u0625\u0636\u0627\u0641\u0629"} <strong>{successCount}</strong> {"\u0645\u0646\u062a\u062c. \u062c\u0627\u0631\u064a \u0627\u0644\u0625\u063a\u0644\u0627\u0642..."}</p>
            </div>
          ) : preview ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{"\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a"} ({preview.length} {"\u0633\u0637\u0631"})</span>
                <div className="flex gap-3">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{validCount} {"\u0635\u0627\u0644\u062d"}</span>
                  {invalidCount > 0 && <span className="text-destructive font-medium">{invalidCount} {"\u063a\u064a\u0631 \u0635\u0627\u0644\u062d"}</span>}
                </div>
              </div>
              <div className="border border-border/60 rounded-lg overflow-hidden">
                <div className="max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-right p-2 font-semibold text-muted-foreground">المنتج</th>
                        <th className="text-right p-2 font-semibold text-muted-foreground">SKU</th>
                        <th className="text-right p-2 font-semibold text-muted-foreground">السعر</th>
                        <th className="text-right p-2 font-semibold text-muted-foreground">الكمية</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className={`border-t border-border/40 ${!row.valid ? "bg-destructive/5" : ""}`}>
                          <td className="p-2 max-w-[160px] truncate font-medium" title={row.name}>{row.name}</td>
                          <td className="p-2 font-mono text-[10px]">{row.sku}</td>
                          <td className="p-2">{row.sellingPrice > 0 ? `${row.sellingPrice}` : "-"}</td>
                          <td className="p-2">{row.quantity}</td>
                          <td className="p-2 text-center">{row.valid ? <span className="text-emerald-500 text-base">✓</span> : <span className="text-destructive text-base" title={row.reason}>✗</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {invalidCount > 0 && (
                <p className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 p-2.5 rounded-lg">
                  ⚠️ السطور غير الصالحة (بدون اسم أو SKU) سيتم تخطيها تلقائياً.
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => { setPreview(null); setRawRows([]); }} disabled={isImporting}>رفع ملف آخر</Button>
                <Button className="flex-1 gap-1.5" onClick={handleConfirmImport} disabled={isImporting || validCount === 0}>
                  <UploadCloud size={15} />
                  {isImporting ? "جاري الاستيراد..." : `استيراد ${validCount} منتج`}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                يدعم النظام ملفات <strong>CSV</strong> أو <strong>TSV/TXT</strong> بما في ذلك شيت تصدير أمازون مباشرة.
              </p>
              <div className="bg-muted/30 rounded-lg p-3 text-xs border border-border/50 space-y-2">
                <p className="font-semibold text-foreground">الأعمدة المعتمدة تلقائياً:</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground">
                  <span><code className="text-primary">اسم-المنتج</code> أو productName</span>
                  <span><code className="text-primary">sku-البائع</code> أو sku</span>
                  <span><code className="text-primary">السعر</code> أو sellingPrice</span>
                  <span><code className="text-primary">الكمية</code> أو quantity</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <Button variant="outline" className="w-full gap-2" onClick={downloadTemplate}>
                  <Download size={16} />تحميل القالب الفارغ (CSV)
                </Button>
                <input type="file" accept=".csv,.tsv,.txt" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                <Button className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Eye size={16} />اختيار الملف ومعاينة البيانات
                </Button>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-start gap-2 text-sm">
              <AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
