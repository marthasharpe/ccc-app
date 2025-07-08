"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
}

interface SelectContentProps {
  children: React.ReactNode;
  onClose?: () => void;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  getDisplayValue?: (value: string) => string;
}>({});

export function Select({
  children,
  value,
  onValueChange,
  defaultValue,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const [valueToLabelMap, setValueToLabelMap] = React.useState<Record<string, string>>({});

  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  const getDisplayValue = (val: string) => {
    return valueToLabelMap[val] || val;
  };

  // Build the value-to-label mapping from children
  React.useEffect(() => {
    const map: Record<string, string> = {};
    React.Children.forEach(children, (child) => {
      if (React.isValidElement<SelectContentProps>(child) && child.type === SelectContent) {
        const childProps = child.props;
        if (childProps && childProps.children) {
          React.Children.forEach(childProps.children, (item) => {
            if (React.isValidElement<SelectItemProps>(item) && item.type === SelectItem) {
              const itemProps = item.props;
              if (itemProps && itemProps.value && itemProps.children) {
                map[itemProps.value] = String(itemProps.children);
              }
            }
          });
        }
      }
    });
    setValueToLabelMap(map);
  }, [children]);

  return (
    <SelectContext.Provider
      value={{ value: currentValue, onValueChange: handleValueChange, getDisplayValue }}
    >
      <div className="relative">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            if (child.type === SelectTrigger) {
              return React.cloneElement(child, {
                ...(child.props || {}),
                onClick: (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                },
                isOpen,
              } as React.ComponentProps<typeof SelectTrigger>);
            }
            if (child.type === SelectContent) {
              return isOpen
                ? React.cloneElement(child, {
                    onClose: () => setIsOpen(false),
                  } as React.ComponentProps<typeof SelectContent>)
                : null;
            }
          }
          return child;
        })}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  children,
  className,
  onClick,
  isOpen,
  tabIndex,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  isOpen?: boolean;
  tabIndex?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={tabIndex}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
      <svg
        className={cn(
          "h-4 w-4 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <polyline points="6,9 12,15 18,9"></polyline>
      </svg>
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, getDisplayValue } = React.useContext(SelectContext);
  const displayValue = value && getDisplayValue ? getDisplayValue(value) : value;
  return <span>{displayValue || placeholder}</span>;
}

export function SelectContent({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[role="listbox"]')) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      role="listbox"
      className="absolute top-full left-0 z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
    >
      {children}
    </div>
  );
}

export function SelectItem({ children, value, disabled = false }: SelectItemProps) {
  const { onValueChange } = React.useContext(SelectContext);

  return (
    <div
      onClick={disabled ? undefined : () => onValueChange?.(value)}
      className={cn(
        "px-3 py-2 text-sm",
        disabled 
          ? "cursor-not-allowed opacity-50 text-muted-foreground" 
          : "cursor-pointer hover:bg-muted hover:text-muted-foreground"
      )}
    >
      {children}
    </div>
  );
}
