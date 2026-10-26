import * as React from "react"
import PropTypes from "prop-types"

import { cn } from "@/lib/utils"

const cardPropTypes = {
  className: PropTypes.string,
}

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-3xl border bg-card text-card-foreground shadow", className)}
    {...props} />
))
Card.displayName = "Card"
Card.propTypes = cardPropTypes

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props} />
))
CardHeader.displayName = "CardHeader"
CardHeader.propTypes = cardPropTypes

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props} />
))
CardTitle.displayName = "CardTitle"
CardTitle.propTypes = cardPropTypes

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
CardDescription.displayName = "CardDescription"
CardDescription.propTypes = cardPropTypes

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"
CardContent.propTypes = cardPropTypes

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
CardFooter.displayName = "CardFooter"
CardFooter.propTypes = cardPropTypes

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
