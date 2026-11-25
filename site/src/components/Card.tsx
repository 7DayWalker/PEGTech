/** Shared card component — frosted glass styling. */
import { forwardRef } from "react";

type CardProps = React.ComponentProps<"div"> & {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, padding = "md", ...props }, ref) => {
    const paddingClasses = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={`rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl transition-all duration-300 ${hover ? "hover:bg-white/[0.07] hover:border-white/20 hover:-translate-y-1" : ""} ${paddingClasses[padding]} ${className || ""}`}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`mb-4 ${className || ""}`} {...props} />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 className={`text-xl font-bold text-slate-100 mb-2 ${className || ""}`} {...props} />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={`text-sm text-slate-400 ${className || ""}`} {...props} />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`${className || ""}`} {...props} />
  );
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`mt-6 pt-6 border-t border-white/10 ${className || ""}`} {...props} />
  );
}
