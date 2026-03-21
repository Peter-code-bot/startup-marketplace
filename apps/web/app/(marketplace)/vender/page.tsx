import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "./product-form";

export const metadata = {
  title: "Publicar producto",
};

export default async function VenderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/vender");
  }

  // Check if user is a seller
  const { data: profile } = await supabase
    .from("profiles")
    .select("es_vendedor")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Publicar producto</h1>
      {!profile?.es_vendedor && (
        <div className="mb-6 rounded-md bg-amber-50 dark:bg-amber-950 p-4 text-sm text-amber-700 dark:text-amber-300">
          Para publicar, necesitas activar tu perfil de vendedor en{" "}
          <a href="/perfil" className="underline font-medium">
            tu perfil
          </a>
          .
        </div>
      )}
      <ProductForm />
    </div>
  );
}
