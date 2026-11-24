/** Shared section wrapper with dark theme. */
import { forwardRef } from "react";

type SectionProps = React.ComponentPropsWithRef<"section"> & {
  py?: number;
  inverse?: boolean;
};

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ className, py = 24, inverse = false, ...props }, ref) => (
    <section
      ref={ref}
      className={`py-${py} ${inverse ? "bg-dark-900" : ""} ${className || ""}`}
      {...props}
    />
  )
);

Section.displayName = "Section";

export const Container = forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className || ""}`}
      {...props}
    />
  )
);

Container.displayName = "Container";

export const SectionHeader = forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`text-center mb-16 lg:mb-24 ${className || ""}`}
      {...props}
    />
  )
);

SectionHeader.displayName = "SectionHeader";
