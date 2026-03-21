import { cn } from "@/lib/utils";
import type { TrustLevel } from "@vicino/shared";
import { Shield, ShieldCheck, Star, Crown } from "lucide-react";

const BADGE_CONFIG: Record<
  TrustLevel,
  { label: string; color: string; bg: string; icon: typeof Shield }
> = {
  nuevo: { label: "Nuevo", color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800", icon: Shield },
  verificado: { label: "Verificado", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", icon: ShieldCheck },
  confiable: { label: "Confiable", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950", icon: ShieldCheck },
  estrella: { label: "Estrella", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950", icon: Star },
  elite: { label: "Élite", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950", icon: Crown },
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
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
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
