/** Shared button component — pill-shaped, Gemini gradient + glass variants. */
import { forwardRef } from "react";

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
};

const variantClasses = {
  primary:
    "bg-gemini-gradient text-white shadow-lg shadow-gemini-purple/25 hover:shadow-gemini-purple/40 hover:brightness-110 focus:ring-gemini-purple/50",
  secondary:
    "bg-white/10 backdrop-blur-md border border-white/10 text-slate-100 hover:bg-white/15 focus:ring-gemini-purple/50",
  ghost:
    "text-slate-300 hover:bg-white/5 hover:text-white focus:ring-gemini-purple/50",
  outline:
    "border border-white/15 backdrop-blur-md bg-white/5 text-slate-100 hover:bg-white/10 hover:border-white/25 focus:ring-gemini-purple/50",
  danger:
    "bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 hover:text-red-300 focus:ring-red-500/30",
};

const sizeClasses = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 ${variantClasses[variant]} ${sizeClasses[size]} ${className || ""}`}
      {...props}
    />
  )
);

Button.displayName = "Button";
