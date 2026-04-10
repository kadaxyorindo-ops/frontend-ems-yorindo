import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type FilterOption = {
  value: string;
  label: string;
};

export interface SearchableFilterSelectProps {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

/**
 * SearchableFilterSelect: For filters with many options
 * Shows max 5 options by default, with search capability when more options exist
 * Useful for companies, industries, job titles, cities, events
 */
export function SearchableFilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: SearchableFilterSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const showSearch = options.length > 5;

  const filteredOptions = searchTerm.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options.slice(0, 5);

  const hiddenCount = !searchTerm.trim()
    ? Math.max(0, options.length - 5)
    : 0;

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400"
      >
        {label}
      </Label>
      {showSearch && (
        <div className="relative">
          <Input
            type="text"
            placeholder={`Search ${options.length} items...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </div>
      )}
      <select
        id={id}
        name={id}
        value={value}
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value);
          setSearchTerm("");
        }}
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 transition focus-visible:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
      >
        {filteredOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {hiddenCount > 0 && (
          <option disabled>
            ... and {hiddenCount} more (type to search)
          </option>
        )}
      </select>
    </div>
  );
}
