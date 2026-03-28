import { cn } from "@/lib/utils";
import type { TrustLevel } from "@vicino/shared";
import { Shield, ShieldCheck, Star, Crown } from "lucide-react";

const BADGE_CONFIG: Record<
  TrustLevel,
  { label: string; color: string; bg: string; icon: typeof Shield }
> = {
  nuevo: {
    label: "Nuevo",
    color: "text-muted-foreground",
    bg: "bg-neutral-100 dark:bg-neutral-800",
    icon: Shield,
  },
  verificado: {
    label: "Verificado",
    color: "text-emerald-trust",
    bg: "bg-emerald-trust/10",
    icon: ShieldCheck,
  },
  confiable: {
    label: "Confiable",
    color: "text-emerald-trust",
    bg: "bg-emerald-trust/10",
    icon: ShieldCheck,
  },
  estrella: {
    label: "Estrella",
    color: "text-gold",
    bg: "bg-gold/10",
    icon: Star,
  },
  elite: {
    label: "Élite",
    color: "text-gold",
    bg: "bg-gold/10",
    icon: Crown,
  },
};

interface SellerBadgeProps {
  level: TrustLevel;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function SellerBadge({
  level,
  showLabel = true,
  size = "sm",
  className,
}: SellerBadgeProps) {
  const config = BADGE_CONFIG[level];
  const Icon = config.icon;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
        config.bg,
        config.color,
        className
      )}
    >
      <Icon className={iconSize} />
      {showLabel && config.label}
    </span>
  );
}
