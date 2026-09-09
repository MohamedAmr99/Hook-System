import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "@/shared/store/useStore";
import { PurchaseForm } from "../components/PurchaseForm";

export function PurchaseEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const purchases = useStore(state => state.purchases);
  const purchase = purchases.find(p => p.id === id);

  if (!purchase) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Purchase not found.</p>
        <button onClick={() => navigate("/purchases")}
          className="text-sm text-primary underline">
          Back to Purchases
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("purchases.form.editTitle")}</h1>
        <p className="text-muted-foreground">
          {t("purchases.subtitle")}
        </p>
      </div>
      <div className="bg-card border rounded-lg p-6">
        <PurchaseForm
          initialData={purchase}
          onSuccess={() => navigate("/purchases")}
        />
      </div>
    </div>
  );
}
