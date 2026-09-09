import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PurchaseForm } from "../components/PurchaseForm";

export function PurchaseCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("purchases.form.createTitle")}</h1>
          <p className="text-muted-foreground">{t("purchases.subtitle")}</p>
        </div>
      </div>
      
      <div className="bg-card border rounded-lg p-6">
        <PurchaseForm onSuccess={() => navigate("/purchases")} />
      </div>
    </div>
  );
}
