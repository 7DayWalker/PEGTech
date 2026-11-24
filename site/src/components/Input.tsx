/** Shared input components with dark theme styling. */
import { forwardRef } from "react";

type InputBaseProps = React.ComponentProps<"input"> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputBaseProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`block w-full rounded-xl border px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
          error ? "border-red-500/30 focus:ring-red-500" : "border-input"
        } ${className || ""}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);

Input.displayName = "Input";

type SelectProps = React.ComponentProps<"select"> & {
  label?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`block w-full rounded-xl border px-4 py-3 text-slate-100 bg-dark-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
          error ? "border-red-500/30 focus:ring-red-500" : "border-input"
        } ${className || ""}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);

Select.displayName = "Select";

type TextareaProps = React.ComponentProps<"textarea"> & {
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`block w-full rounded-xl border px-4 py-3 text-slate-100 placeholder-slate-500 bg-dark-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
          error ? "border-red-500/30 focus:ring-red-500" : "border-input"
        } ${className || ""}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);

Textarea.displayName = "Textarea";

export const Badge = forwardRef<HTMLSpanElement, React.ComponentProps<"span"> & {
  variant?: "default" | "blue" | "success" | "warning";
}>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-slate-800/50 text-slate-400 border border-slate-700/50",
      blue: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      success: "bg-green-500/10 text-green-400 border border-green-500/20",
      warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    };
    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${variantClasses[variant]} ${className || ""}`}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
