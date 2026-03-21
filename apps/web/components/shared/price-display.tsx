import { formatPrice } from "@vicino/shared";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({ amount, size = "md", className }: PriceDisplayProps) {
  return (
    <span
      className={cn(
        "font-semibold",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-xl",
        className
      )}
    >
      {formatPrice(amount)}
    </span>
  );
}
