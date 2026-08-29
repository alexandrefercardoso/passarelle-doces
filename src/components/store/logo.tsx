import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
};

function Logo({ className, size = "md", asLink = true }: LogoProps) {
  const inner = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-chocolate shadow-sm ring-1 ring-gold/50",
          size === "sm" && "h-9 w-9 text-base",
          size === "md" && "h-11 w-11 text-lg",
          size === "lg" && "h-14 w-14 text-2xl",
        )}
      >
        <span className="font-display font-black italic text-gold">P</span>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display font-black uppercase tracking-wide text-chocolate-dark",
            size === "sm" ? "text-base" : size === "md" ? "text-xl" : "text-2xl",
          )}
        >
          Passarelli
        </span>
        <span
          className={cn(
            "font-semibold uppercase tracking-[0.35em] text-gold-dark",
            size === "sm" ? "text-[9px]" : size === "md" ? "text-[10px]" : "text-xs",
          )}
        >
          Doces
        </span>
      </span>
    </span>
  );

  if (!asLink) return inner;

  return (
    <Link to="/" aria-label="PASSARELLI DOCES - Início">
      {inner}
    </Link>
  );
}

export { Logo };
