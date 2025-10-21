"use client";

import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  autoFocus?: boolean;
  submitLabel?: string;
  submitIcon?: React.ReactNode;
  showSubmitButton?: boolean;
  onSubmit?: () => void;
  containerClassName?: string;
}

export const QueryInput = React.forwardRef<HTMLInputElement, QueryInputProps>(
  (
    {
      value,
      onChange,
      placeholder = "Ask a question...",
      disabled = false,
      maxLength = 500,
      className = "",
      autoFocus = false,
      submitLabel = "Ask",
      submitIcon,
      showSubmitButton = true,
      onSubmit,
      containerClassName = "",
    },
    ref
  ) => {
    return (
      <div
        className={`flex flex-col sm:flex-row gap-3 w-full ${containerClassName}`}
      >
        <div className="relative flex-1 w-full">
          <Input
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={`w-full pr-10 ${className}`}
            autoFocus={autoFocus}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center justify-end text-muted-foreground hover:text-foreground transition-colors"
              title="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {showSubmitButton && (
          <Button
            type="submit"
            disabled={disabled || !value.trim()}
            onClick={onSubmit}
            className="w-full sm:w-auto shrink-0 min-w-[100px]"
          >
            {submitIcon && <span className="mr-2">{submitIcon}</span>}
            {submitLabel}
          </Button>
        )}
      </div>
    );
  }
);

QueryInput.displayName = "QueryInput";
