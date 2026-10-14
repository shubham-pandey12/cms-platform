'use client';

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type AccordionRootProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;

/** Props accepted by our Accordion wrapper; includes collapsible so we can strip it and avoid forwarding to the DOM. */
type AccordionProps = AccordionRootProps & { collapsible?: boolean };

/**
 * Wrapper around AccordionPrimitive.Root that explicitly passes only known props
 * to avoid forwarding non-DOM attributes (e.g. collapsible) to the underlying div.
 * We omit collapsible from the props passed to Root so it never reaches the DOM
 * (Radix single-type accordion will keep one item open by default).
 */
const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      type,
      value,
      defaultValue,
      onValueChange,
      collapsible: _collapsible,
      dir,
      className,
      style,
      children,
      ...rest
    },
    ref
  ) => (
    <AccordionPrimitive.Root
      ref={ref}
      {...({ type, value, defaultValue, onValueChange, dir, className, style, ...rest } as AccordionRootProps)}
    >
      {children}
    </AccordionPrimitive.Root>
  )
);
Accordion.displayName = "Accordion";

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props} />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
