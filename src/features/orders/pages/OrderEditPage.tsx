import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { OrderForm } from "../components/OrderForm";
import { useStore } from "@/shared/store/useStore";

export function OrderEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const order = useStore(state => state.orders.find(o => o.id === id));

  if (!order) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t("orders.editOrder")} — Order not found
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("orders.form.editTitle")}</h1>
        <p className="text-muted-foreground">#{order.platformOrderId}</p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <OrderForm initialData={order} onSuccess={() => navigate("/orders")} />
      </div>
    </div>
  );
}
