import { cn } from "@/lib/utils/cn";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary: "border border-border-strong bg-surface hover:bg-surface-2 text-fg",
  ghost: "hover:bg-surface-2 text-fg-muted hover:text-fg",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-sm",
  icon: "h-9 w-9",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "secondary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
        "active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
