/** Shared button component with dark theme variants. */
import { forwardRef } from "react";

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
};

const variantClasses = {
  primary:
    "bg-accent text-dark-900 shadow-lg shadow-accent/20 hover:bg-accent/90 hover:shadow-accent/30 focus:ring-accent",
  secondary:
    "bg-slate-800 text-slate-100 shadow-sm hover:bg-slate-700 focus:ring-slate-600",
  ghost:
    "text-slate-300 hover:bg-slate-800 hover:text-slate-100 focus:ring-slate-600",
  outline:
    "border border-border text-slate-300 hover:bg-slate-800 hover:border-slate-600 focus:ring-slate-600",
  danger:
    "bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 hover:text-red-300 focus:ring-red-500/30",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-xl font-semibold shadow-sm transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 ${variantClasses[variant]} ${sizeClasses[size]} ${className || ""}`}
      {...props}
    />
  )
);

Button.displayName = "Button";
