/** Shared input components — frosted glass styling. */
import { forwardRef } from "react";

type InputBaseProps = React.ComponentProps<"input"> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputBaseProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="label-base">{label}</label>}
      <input
        ref={ref}
        className={`block w-full rounded-2xl border bg-white/[0.03] backdrop-blur-md px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gemini-purple/50 focus:border-transparent transition-all duration-200 ${
          error ? "border-red-500/30 focus:ring-red-500" : "border-white/10"
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
  ({ className, label, error, children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="label-base">{label}</label>}
      <select
        ref={ref}
        className={`block w-full rounded-2xl border bg-dark-800 backdrop-blur-md px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-gemini-purple/50 focus:border-transparent transition-all duration-200 ${
          error ? "border-red-500/30 focus:ring-red-500" : "border-white/10"
        } ${className || ""}`}
        {...props}
      >
        {children}
      </select>
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
      {label && <label className="label-base">{label}</label>}
      <textarea
        ref={ref}
        className={`block w-full rounded-2xl border bg-white/[0.03] backdrop-blur-md px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gemini-purple/50 focus:border-transparent transition-all duration-200 ${
          error ? "border-red-500/30 focus:ring-red-500" : "border-white/10"
        } ${className || ""}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);

Textarea.displayName = "Textarea";
