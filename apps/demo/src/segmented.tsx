import type { ReactNode } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

/** A small labelled segmented control, local to the demo's own chrome. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div dir="ltr" className="inline-flex items-center gap-1 rounded-md border border-input bg-background p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={option.value === value}
            className={[
              'inline-flex h-7 items-center justify-center rounded-sm px-2.5 text-xs font-medium transition-colors',
              option.value === value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
