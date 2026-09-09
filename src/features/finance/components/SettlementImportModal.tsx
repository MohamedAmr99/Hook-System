import { useState, useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { useTranslation } from "react-i18next";
import { SettlementService } from "@/features/settlements/services/settlement.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { X, UploadCloud, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function SettlementImportModal({ onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ matched: number, total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file || !user) return;
    setIsUploading(true);
    setError(null);

    try {
      const text = await file.text();
      const res = await SettlementService.importAmazonSettlement(text, user.uid);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to import settlement file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border shadow-lg rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h2 className="font-semibold">{t("finance.importSettlement", "Import Amazon Settlement")}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {!result ? (
            <>
              <div 
                className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept=".txt,.tsv,.csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <UploadCloud className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium mt-2">
                  {file ? file.name : t("finance.uploadDragDrop", "Click to select file")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("finance.uploadFormats", "Accepts .txt, .tsv from Amazon Seller Central")}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={onClose} disabled={isUploading}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleImport} disabled={!file || isUploading}>
                  {isUploading ? t("common.saving") : t("finance.startImport", "Start Import")}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <CheckCircle className="h-14 w-14 text-emerald-500" />
              <h3 className="text-lg font-bold">{t("finance.importSuccess", "Import Successful")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("finance.importSummary", "Processed {{total}} records and updated {{matched}} orders.", {
                  total: result.total,
                  matched: result.matched
                })}
              </p>
              <Button className="mt-4" onClick={() => { onSuccess(); onClose(); }}>
                {t("common.done", "Done")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
