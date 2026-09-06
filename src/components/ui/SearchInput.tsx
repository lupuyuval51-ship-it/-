"use client";
import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { controlBaseClasses, controlStateClasses } from "./Field";

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value: string;
  onChange: (value: string) => void;
  /** Debounced callback (ms) for expensive filtering; `onChange` still fires immediately. */
  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;
  wrapperClassName?: string;
}

/** Search field with a leading icon and a clear button. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, onDebouncedChange, debounceMs = 250, wrapperClassName, className, placeholder, "aria-label": ariaLabel, ...rest },
  ref,
) {
  const { t } = useT();
  const [internal, setInternal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setInternal(value), [value]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const update = (next: string) => {
    setInternal(next);
    onChange(next);
    if (onDebouncedChange) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onDebouncedChange(next), debounceMs);
    }
  };

  return (
    <div className={cn("relative flex items-center", wrapperClassName)} role="search">
      <Search aria-hidden className="pointer-events-none absolute start-3 size-5 text-muted" />
      <input
        ref={ref}
        type="search"
        value={internal}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder ?? t("ui.search.placeholder")}
        aria-label={ariaLabel ?? placeholder ?? t("common.search")}
        enterKeyHint="search"
        autoComplete="off"
        className={cn(controlBaseClasses, controlStateClasses(false), "h-11 pe-11 ps-11 text-base [&::-webkit-search-cancel-button]:hidden", className)}
        {...rest}
      />
      {internal && (
        <button
          type="button"
          onClick={() => update("")}
          aria-label={t("ui.search.clear")}
          className="absolute end-1 inline-flex size-9 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
});
