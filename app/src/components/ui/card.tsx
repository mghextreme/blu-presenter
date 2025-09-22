import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "flex flex-col gap-6 rounded-md shadow-sm overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-card text-card-foreground border",
        secondary:
          "bg-gray-200 text-gray-800 dark:bg-gray-900 dark:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header flex flex-col sm:flex-row justify-between items-center gap-1.5 p-4",
        className
      )}
      {...props}
    />
  )
}

function CardHeaderText({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header-text"
      className={cn("flex flex-col gap-1.5 w-full", className)}
      {...props}
    />
  )
}

function CardHeaderActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header-text"
      className={cn("flex justify-end gap-1.5 w-full sm:w-auto", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardHeaderText,
  CardHeaderActions,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
