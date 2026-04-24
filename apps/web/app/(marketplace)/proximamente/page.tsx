import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export const metadata = { title: "Próximamente — VICINO" };

export default function ProximamentePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Próximamente</h1>
      <p className="text-muted-foreground max-w-sm mb-6">
        Estamos trabajando en esta sección. Muy pronto la tendrás disponible.
      </p>
      <Link
        href="/perfil"
        className="inline-flex items-center gap-2 rounded-full px-5 py-3 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al perfil
      </Link>
    </div>
  );
}
