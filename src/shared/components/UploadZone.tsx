import * as React from "react";
import { Upload, X, FileImage, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ProductService } from "@/features/products/services/product.service";
import { cn } from "@/shared/lib/utils";

interface UploadZoneProps {
  onUploadComplete: (urls: string[]) => void;
  existingUrls?: string[];
  onRemove?: (url: string) => void;
  maxFiles?: number;
  label?: string;
  className?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

export function UploadZone({
  onUploadComplete,
  existingUrls = [],
  onRemove,
  maxFiles = 5,
  label = "Upload files",
  className,
}: UploadZoneProps) {
  const { t } = useTranslation();
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [uploadingFiles, setUploadingFiles] = React.useState<UploadingFile[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFiles = async (files: FileList) => {
    const validFiles: File[] = [];
    const newUploading: UploadingFile[] = [];

    // Filter and validate files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file limit
      if (existingUrls.length + validFiles.length >= maxFiles) {
        alert(t("upload.maxFilesAlert", { count: maxFiles }));
        break;
      }

      // Check type
      if (!file.type.startsWith("image/")) {
        alert(t("upload.notImageAlert", { name: file.name }));
        continue;
      }

      // Check size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert(t("upload.fileSizeAlert", { name: file.name }));
        continue;
      }

      validFiles.push(file);
      newUploading.push({
        id: `${file.name}-${Date.now()}-${i}`,
        name: file.name,
        progress: 0,
        status: "uploading",
      });
    }

    if (validFiles.length === 0) return;

    setUploadingFiles((prev) => [...prev, ...newUploading]);

    // Upload files sequentially
    const uploadedUrls: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const tracking = newUploading[i];

      try {
        const url = await ProductService.uploadProductImage(file, (progress) => {
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === tracking.id ? { ...f, progress } : f))
          );
        });

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === tracking.id ? { ...f, status: "completed", progress: 100 } : f
          )
        );

        uploadedUrls.push(url);
      } catch (err: any) {
        let errorMessage = err.message || "Failed to upload";
        if (err.code === "storage/unauthorized" || err.message.includes("permission_denied")) {
          errorMessage = "Firebase Storage Rules denied access (or missing CORS). Check your Firebase Console.";
        }
        
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === tracking.id
              ? { ...f, status: "error", error: errorMessage }
              : f
          )
        );
      }
    }

    if (uploadedUrls.length > 0) {
      onUploadComplete(uploadedUrls);
      // Clean up successful uploads from list after a short delay
      setTimeout(() => {
        setUploadingFiles((prev) =>
          prev.filter((f) => f.status !== "completed")
        );
      }, 1500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Box */}
      {existingUrls.length < maxFiles && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerInput}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 select-none flex flex-col items-center justify-center min-h-[140px] bg-card hover:bg-muted/30 border-border hover:border-primary/50 group",
            isDragActive && "border-primary bg-primary/5 ring-4 ring-primary/10 scale-[0.99]"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={maxFiles > 1}
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
          
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
            <Upload size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          
          <p className="text-sm font-semibold text-foreground/80 mb-1">
            {label}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("upload.dragDropHint")}
          </p>
        </div>
      )}

      {/* Progress Bars */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card text-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                {file.status === "uploading" ? (
                  <Loader2 size={16} className="animate-spin text-primary" />
                ) : (
                  <FileImage size={16} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="truncate pr-4 text-foreground/80">{file.name}</span>
                  <span className={cn(
                    file.status === "error" ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {file.status === "error" ? t("upload.failed") : `${file.progress}%`}
                  </span>
                </div>
                {file.status === "error" ? (
                  <p className="text-[10px] text-destructive truncate">{file.error}</p>
                ) : (
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files Previews */}
      {existingUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {existingUrls.map((url, index) => (
            <div
              key={url}
              className="relative group aspect-square rounded-xl border border-border overflow-hidden bg-muted animate-in zoom-in-95 duration-200 shadow-sm"
            >
              <img
                src={url}
                alt={`Upload preview ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(url)}
                    className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground hover:scale-110 active:scale-95 transition-transform flex items-center justify-center shadow-md"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
