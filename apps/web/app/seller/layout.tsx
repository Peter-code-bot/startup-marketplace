import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/seller");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {children}
    </div>
  );
}
