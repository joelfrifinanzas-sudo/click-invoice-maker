import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--btn-primary))] text-[hsl(var(--btn-primary-foreground))] hover:bg-[hsl(var(--btn-primary-hover))] active:bg-[hsl(var(--btn-primary-active))] shadow-sm hover:shadow-md",
        destructive:
          "bg-[hsl(var(--btn-destructive))] text-[hsl(var(--btn-destructive-foreground))] hover:bg-[hsl(var(--btn-destructive-hover))] active:bg-[hsl(var(--btn-destructive-active))] shadow-sm hover:shadow-md",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md",
        secondary:
          "bg-[hsl(var(--btn-secondary))] text-[hsl(var(--btn-secondary-foreground))] border border-[hsl(var(--btn-secondary-border))] hover:bg-[hsl(var(--btn-secondary-hover))] active:bg-[hsl(var(--btn-secondary-active))] shadow-sm hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-[hsl(var(--btn-success))] text-[hsl(var(--btn-success-foreground))] hover:bg-[hsl(var(--btn-success-hover))] active:bg-[hsl(var(--btn-success-active))] shadow-sm hover:shadow-md",
        warning: "bg-[hsl(var(--btn-warning))] text-[hsl(var(--btn-warning-foreground))] hover:bg-[hsl(var(--btn-warning-hover))] active:bg-[hsl(var(--btn-warning-active))] shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-touch",
        sm: "h-9 rounded-md px-3 min-h-[2.25rem]",
        lg: "h-11 rounded-md px-8 min-h-touch-comfortable",
        xl: "h-12 rounded-lg px-10 text-base min-h-touch-comfortable",
        icon: "h-10 w-10 min-h-touch min-w-touch",
        "icon-sm": "h-8 w-8 min-h-[2rem] min-w-[2rem]",
        "icon-lg": "h-12 w-12 min-h-touch-comfortable min-w-touch-comfortable",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
