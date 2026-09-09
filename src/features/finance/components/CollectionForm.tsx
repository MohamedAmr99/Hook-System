import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { CollectionSchema } from "../schemas/collection.schema";
import { useStore } from "@/shared/store/useStore";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";

export function CollectionForm({ initialData, onSuccess }: { initialData?: any, onSuccess?: () => void }) {
  const navigate = useNavigate();
  const addCollection = useStore(state => state.addCollection);
  const updateCollection = useStore(state => state.updateCollection);

  const { register, handleSubmit, watch } = useForm<any>({
    resolver: zodResolver(CollectionSchema),
    defaultValues: initialData || {
      collectionDate: Date.now(),
      status: "Reconciled",
      expectedAmount: 0,
      actualAmount: 0,
      difference: 0,
      platformId: "Noon",
      receivingAccountId: "Bank",
    }
  });

  const expected = Number(watch("expectedAmount") || 0);
  const actual   = Number(watch("actualAmount")   || 0);
  const diff     = expected - actual;

  const onSubmit = (data: any) => {
    data.difference = data.expectedAmount - data.actualAmount;
    if (data.difference === 0)         data.status = "Reconciled";
    else if (data.actualAmount > 0)    data.status = "PartiallyReconciled";
    else                               data.status = "Difference";

    if (initialData?.id) {
      updateCollection(initialData.id, data);
    } else {
      addCollection({ ...data, id: uuidv4(), createdBy: "System", createdAt: Date.now() });
    }

    if (onSuccess) onSuccess();
    else navigate("/finance/collections");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>المنصة</Label>
          <select {...register("platformId")} className="w-full h-10 border rounded-md px-3 bg-background mt-1">
            <option value="Noon">Noon</option>
            <option value="Jumia">Jumia</option>
            <option value="Kenz">Kenz</option>
            <option value="Amazon">Amazon</option>
            <option value="Own Store">Own Store</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <Label>حساب الاستلام</Label>
          <select {...register("receivingAccountId")} className="w-full h-10 border rounded-md px-3 bg-background mt-1">
            <option value="Bank">Bank</option>
            <option value="Cash">Cash</option>
            <option value="Wallet">Wallet</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>المبلغ المتوقع (من الطلبات)</Label>
          <Input type="number" step="0.01" {...register("expectedAmount")} />
        </div>
        <div>
          <Label>المبلغ الفعلي (المحصل)</Label>
          <Input type="number" step="0.01" {...register("actualAmount")} />
        </div>
      </div>

      <div className={`p-3 rounded-lg border flex justify-between items-center ${diff !== 0 ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"}`}>
        <span className="text-sm font-medium">الفرق (Expected - Actual)</span>
        <span className={`font-bold text-lg ${diff !== 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
          {diff.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>رقم المرجع (اختياري)</Label>
          <Input {...register("reference")} placeholder="Bank transfer ID" />
        </div>
        <div>
          <Label>ملاحظات</Label>
          <Input {...register("notes")} placeholder="أي ملاحظات..." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>فترة التسوية - من</Label>
          <Input type="date" {...register("settlementPeriodStart")} />
        </div>
        <div>
          <Label>فترة التسوية - إلى</Label>
          <Input type="date" {...register("settlementPeriodEnd")} />
        </div>
      </div>

      <Button type="submit" className="w-full">حفظ التحصيل</Button>
    </form>
  );
}
