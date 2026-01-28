import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Figma Design System Variants (Priority 1)
        primary: "bg-figma-purple-50 !text-figma-gray-00 hover:bg-figma-purple-60 disabled:bg-figma-gray-40 disabled:!text-figma-gray-30 shadow-figma-01 hover:shadow-figma-02",
        secondary: "bg-figma-gray-10 !text-figma-gray-80 hover:bg-figma-gray-15 disabled:bg-figma-gray-05 disabled:!text-figma-gray-40",
        tertiary: "bg-transparent !text-figma-purple-50 hover:bg-figma-purple-00 disabled:!text-figma-gray-40",
        icon: "bg-transparent !text-figma-gray-100 hover:bg-figma-gray-10 disabled:!text-figma-gray-40",
        
        // Legacy Variants (Deprecated - 점진적 마이그레이션 예정)
        default: "bg-primary text-primary-foreground hover:bg-primary/90 text-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground text-sm",
        link: "text-primary underline-offset-4 hover:underline text-sm",
        purple: "!bg-figma-purple-60 !text-white hover:!bg-figma-purple-70",
        "purple-outline": "border border-figma-gray-40 !bg-figma-gray-00 !text-figma-gray-80 hover:!bg-figma-gray-10",
      },
      size: {
        // Figma Design System Sizes (Priority 1)
        xl: "h-[54px] px-6 text-glyph-18 font-bold gap-[6px] rounded-lg",
        lg: "h-[42px] px-5 text-glyph-16 font-medium gap-1 rounded-lg",
        md: "h-[40px] px-4 text-glyph-14 font-medium gap-1 rounded-lg",
        sm: "h-[32px] px-3 text-glyph-12 font-medium gap-1 rounded-md",
        
        // Icon Button Sizes
        "icon-lg": "size-[40px] rounded-lg [&_svg]:size-5",
        "icon-md": "size-[32px] rounded-md [&_svg]:size-4",
        "icon-sm": "size-[24px] rounded [&_svg]:size-3",
        
        // Legacy Sizes (Deprecated)
        default: "h-10 px-4 py-2 gap-2",
        icon: "h-10 w-10 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
