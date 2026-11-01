import React from "react"
import { cn } from "../../lib/utils"

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    
    // Apple/Airbnb minimalist interaction styling
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
    
    const variants = {
      default: "bg-gray-900 text-white shadow-sm hover:bg-gray-800",
      primary: "bg-[#4F46E5] text-white shadow-sm hover:bg-indigo-600",
      destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600/90",
      outline: "border border-gray-200 bg-transparent hover:bg-gray-100 text-gray-900",
      secondary: "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200",
      ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-600",
      link: "text-gray-900 underline-offset-4 hover:underline",
    }
    
    const sizes = {
      default: "h-11 px-6 py-2",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-14 rounded-2xl px-10 text-base",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
