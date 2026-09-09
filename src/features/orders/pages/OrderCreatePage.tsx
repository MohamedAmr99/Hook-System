import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { OrderForm } from "../components/OrderForm";

export function OrderCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("orders.form.title")}</h1>
        <p className="text-muted-foreground">{t("orders.form.subtitle")}</p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <OrderForm onSuccess={() => navigate("/orders")} />
      </div>
    </div>
  );
}
