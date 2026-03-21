import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-6 mt-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>&copy; 2026 VICINO. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <Link href="/terminos" className="hover:text-foreground transition-colors">
            Términos y condiciones
          </Link>
          <Link href="/privacidad" className="hover:text-foreground transition-colors">
            Aviso de privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}
