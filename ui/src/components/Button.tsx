import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-safee-600 text-white hover:bg-safee-700 focus-visible:ring-safee-600",
        primary: "bg-safee-600 text-white hover:bg-safee-700 focus-visible:ring-safee-600",
        secondary: "bg-zinc-900 text-white hover:bg-zinc-700 focus-visible:ring-zinc-900",
        outline: "border-2 border-zinc-900 bg-white hover:bg-zinc-100 focus-visible:ring-zinc-900",
        ghost: "hover:bg-zinc-100 hover:text-zinc-900",
        link: "text-safee-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-11 rounded-md px-8 text-lg",
        icon: "h-10 w-10",
      },
      rounded: {
        default: "rounded-lg",
        sm: "rounded-md",
        lg: "rounded-xl",
        full: "rounded-full",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, rounded, className }))} ref={ref} {...props} />
    );
  },
);

Button.displayName = "Button";
