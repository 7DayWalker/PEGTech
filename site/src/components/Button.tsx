/** Shared button component with dark theme + blue accent variants. */
import { forwardRef } from "react";

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
};

const variantClasses = {
  primary:
    "bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 hover:shadow-blue-600/40 focus:ring-blue-500",
  secondary:
    "bg-slate-800 text-slate-100 shadow-sm hover:bg-slate-700 focus:ring-blue-500",
  ghost:
    "text-slate-300 hover:bg-slate-800 hover:text-white focus:ring-blue-500",
  outline:
    "border border-blue-600 text-blue-400 hover:bg-blue-600/10 hover:border-blue-500 hover:text-blue-300 focus:ring-blue-500",
  danger:
    "bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 hover:text-red-300 focus:ring-red-500/30",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-xl font-semibold shadow-sm transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 ${variantClasses[variant]} ${sizeClasses[size]} ${className || ""}`}
      {...props}
    />
  )
);

Button.displayName = "Button";
