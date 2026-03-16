import type React from "react";
import { cn } from "../../lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30",
        className
      )}
      {...props}
    />
  );
}
