"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  showRequiredMark?: boolean;
}

export function PasswordInput({
  label,
  error,
  showRequiredMark = false,
  id,
  className,
  required,
  ...inputProps
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const [visible, setVisible] = useState(false);

  return (
    <div className={`field password-input-field ${error ? "has-error" : ""} ${className ?? ""}`.trim()}>
      <label htmlFor={inputId}>
        {label}{showRequiredMark && required ? <span className="required-mark" aria-hidden="true"> *</span> : null}
      </label>
      <div className="password-input-wrap">
        <input
          {...inputProps}
          id={inputId}
          type={visible ? "text" : "password"}
          required={required}
          aria-required={required || undefined}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : inputProps["aria-describedby"]}
        />
        <button
          type="button"
          className="password-visibility-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {error ? <small id={errorId} role="alert">{error}</small> : null}
    </div>
  );
}
