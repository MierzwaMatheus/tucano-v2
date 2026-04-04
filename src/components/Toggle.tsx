import type { ReactNode } from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  icon,
  disabled = false,
}: ToggleProps): React.ReactElement {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-3 w-full transition-opacity ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-surface-elevated border border-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      <span className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  );
}
