import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-tight transition-[transform,background,box-shadow,color] duration-200 ease-pf-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:-translate-y-[1px] active:translate-y-[0.5px]",
  {
    variants: {
      variant: {
        default:
          "bg-pf-green text-white shadow-[0_15px_35px_rgba(15,90,54,0.25)] hover:bg-pf-green-600 hover:shadow-[0_20px_40px_rgba(15,90,54,0.35)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_10px_30px_rgba(220,38,38,0.25)]",
        outline:
          "border border-pf-green bg-transparent text-pf-green hover:bg-pf-green hover:text-white hover:shadow-[0_15px_35px_rgba(15,90,54,0.25)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[0_10px_30px_rgba(107,148,132,0.25)]",
        ghost: "bg-transparent text-foreground hover:bg-muted/60 hover:text-pf-green",
        link: "text-pf-green underline-offset-4 hover:underline",
        accent:
          "bg-accent text-accent-foreground shadow-glow hover:shadow-[0_20px_45px_rgba(255,184,77,0.35)] hover:brightness-105",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
