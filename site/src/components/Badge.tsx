/** Shared badge component with dark theme variants. */
import { forwardRef } from "react";

type BadgeProps = React.ComponentProps<"span"> & {
  variant?: "default" | "accent" | "success" | "warning";
};

const variantClasses = {
  default: "bg-slate-800/50 text-slate-400 border border-slate-700/50",
  accent: "bg-accent/10 text-accent border border-accent/20",
  success: "bg-green-500/10 text-green-400 border border-green-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${variantClasses[variant]} ${className || ""}`}
      {...props}
    />
  )
);

Badge.displayName = "Badge";
