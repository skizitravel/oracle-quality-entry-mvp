"use client";

import type { FormFieldConfig } from "@/lib/types";
import { Input, Select, Textarea } from "@/components/ui/input";

type Props = {
  field: FormFieldConfig;
  value: string | number | undefined;
  error?: string;
  onChange: (value: string | number) => void;
};

export function FieldControl({ field, value, error, onChange }: Props) {
  const shared = {
    id: field.id,
    disabled: field.readOnly,
    required: field.required
  };

  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-800">
        {field.displayLabel}
        {field.required ? <span className="text-destructive"> *</span> : null}
      </span>
      {field.type === "textarea" ? (
        <Textarea {...shared} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />
      ) : field.type === "dropdown" ? (
        <Select {...shared} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select...</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          {...shared}
          type={field.type}
          value={value ?? ""}
          onChange={(event) =>
            onChange(field.type === "number" && event.target.value !== "" ? Number(event.target.value) : event.target.value)
          }
        />
      )}
      {error ? <span className="text-xs font-medium text-destructive">{error}</span> : null}
    </label>
  );
}
