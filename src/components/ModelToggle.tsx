"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModelToggleProps {
  selectedModel: "gpt-5.4-mini" | "gpt-6.2-sol";
  onModelChange: (model: "gpt-5.4-mini" | "gpt-6.2-sol") => void;
  disabled?: boolean;
}

export function ModelToggle({
  selectedModel,
  onModelChange,
  disabled = false,
}: ModelToggleProps) {
  return (
    <div className="flex items-center gap-3 mt-3">
      <label className="text-sm font-medium text-muted-foreground">
        Response style:
      </label>
      <Select
        value={selectedModel}
        onValueChange={(value) =>
          onModelChange(value as "gpt-5.4-mini" | "gpt-6.2-sol")
        }
      >
        <SelectTrigger
          className={`w-36 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-5.4-mini">Simple</SelectItem>
          <SelectItem value="gpt-6.2-sol">In-Depth</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
