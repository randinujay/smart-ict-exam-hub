"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ConfirmSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  message: string;
}

export function ConfirmSubmitButton({ children, message, onClick, ...props }: ConfirmSubmitButtonProps) {
  return (
    <button
      {...props}
      type="submit"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
