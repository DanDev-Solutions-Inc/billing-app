import * as React from "react";
import { cn } from "@lib/utils";
import { inputClass } from "@components/ui/input-class";

/* Vision UI textarea — shares the field styling with <Input>. */
export const Textarea = ({
  className,
  ...props
}: React.ComponentProps<"textarea">) => (
  <textarea
    data-slot="textarea"
    className={cn(inputClass, "min-h-16", className)}
    {...props}
  />
);
