/** Shared badge component — glass theme variants. */
import { forwardRef } from "react";

type BadgeProps = React.ComponentProps<"span"> & {
  variant?: "default" | "accent" | "success" | "warning";
};

const variantClasses = {
  default: "bg-white/5 text-slate-300 border border-white/10",
  accent: "bg-gemini-gradient text-white border-0",
  success: "bg-green-500/10 text-green-400 border border-green-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide border transition-colors ${variantClasses[variant]} ${className || ""}`}
      {...props}
    />
  )
);

Badge.displayName = "Badge";
