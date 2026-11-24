/** Shared input component with dark theme styling. */
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
        className={`block w-full rounded-xl border px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 ${
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
        className={`block w-full rounded-xl border px-4 py-3 text-slate-100 bg-dark-900/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 ${
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
        className={`block w-full rounded-xl border px-4 py-3 text-slate-100 placeholder-slate-500 bg-dark-900/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 ${
          error ? "border-red-500/30 focus:ring-red-500" : "border-input"
        } ${className || ""}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);

Textarea.displayName = "Textarea";
