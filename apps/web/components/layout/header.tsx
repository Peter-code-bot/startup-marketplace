import Link from "next/link";
import { Search } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4 h-14 px-4 max-w-7xl mx-auto">
        <Link href="/" className="font-bold text-xl shrink-0">
          VICINO
        </Link>
        <div className="flex-1 max-w-xl">
          <Link
            href="/buscar"
            className="flex items-center gap-2 w-full rounded-full border bg-muted/50 px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Busca en VICINO...</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
