import { CouponForm } from "./coupon-form";

export const metadata = { title: "Crear cupón" };

export default function NuevoCuponPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Crear cupón</h1>
      <p className="text-sm text-muted-foreground">
        Los cupones se muestran en tus productos. Los compradores los mencionan
        durante la negociación por chat.
      </p>
      <CouponForm />
    </div>
  );
}
