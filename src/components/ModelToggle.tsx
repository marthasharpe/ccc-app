"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModelToggleProps {
  selectedModel: "gpt-3.5-turbo" | "gpt-4";
  onModelChange: (model: "gpt-3.5-turbo" | "gpt-4") => void;
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
          onModelChange(value as "gpt-3.5-turbo" | "gpt-4")
        }
      >
        <SelectTrigger
          className={`w-36 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-3.5-turbo">Simple</SelectItem>
          <SelectItem value="gpt-4">In-Depth</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
