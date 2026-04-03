import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthYear, prevMonth, nextMonth } from "../lib/dates";

interface Props {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthNavigator({ month, year, onChange }: Props) {
  const prev = prevMonth(month, year);
  const next = nextMonth(month, year);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(prev.month, prev.year)}
        className="p-1.5 rounded-button hover:bg-surface-elevated transition-colors text-text-muted hover:text-text-secondary"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="font-semibold text-text-primary min-w-[140px] text-center">
        {formatMonthYear(month, year)}
      </span>
      <button
        onClick={() => onChange(next.month, next.year)}
        className="p-1.5 rounded-button hover:bg-surface-elevated transition-colors text-text-muted hover:text-text-secondary"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
