import { useId } from 'react';
import { Icon, type IconName } from '../Icon';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  icon?: IconName;
  lang?: string;
}

/** Accessible segmented control built on native radio buttons (arrow keys work). */
export function Segmented<T extends string | number>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-fg">{legend}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-[14px] bg-surface-soft p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className="relative flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control px-3 text-sm font-semibold text-muted transition has-checked:bg-surface has-checked:text-fg has-checked:shadow-sm has-focus-visible:outline-3 has-focus-visible:outline-primary/45"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.icon && <Icon name={option.icon} size={18} />}
            <span lang={option.lang}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
