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
        className={`rounded-2xl border border-border bg-dark-800/50 backdrop-blur-sm shadow-lg transition-all duration-300 ${hover ? "hover:-translate-y-1 hover:border-slate-600/50 hover:shadow-xl" : "hover:border-slate-600/30"} ${paddingClasses[padding]} ${className || ""}`}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

/** Card header section */
export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`mb-4 ${className || ""}`} {...props} />
  );
}

/** Card title */
export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 className={`text-xl font-bold text-slate-100 mb-2 ${className || ""}`} {...props} />
  );
}

/** Card description */
export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={`text-sm text-slate-400 ${className || ""}`} {...props} />
  );
}

/** Card footer */
export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`mt-6 pt-6 border-t border-border ${className || ""}`} {...props} />
  );
}

/** Card content body */
export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`${className || ""}`} {...props} />
  );
}
