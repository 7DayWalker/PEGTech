/** Shared card component with dark theme styling. */
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
        className={`rounded-2xl border border-border/50 bg-dark-800/50 backdrop-blur-sm shadow-lg transition-all duration-300 ${hover ? "hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-blue-500/10" : "hover:border-slate-600/30"} ${paddingClasses[padding]} ${className || ""}`}
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
    <div className={`mt-6 pt-6 border-t border-border/50 ${className || ""}`} {...props} />
  );
}
