import type React from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30",
        className
      )}
      {...props}
    />
  );
}
