import { formatBRL } from "./currency";

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDiff(current: number, previous: number): string {
  const diff = current - previous;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${formatBRL(diff)}`;
}

export function formatPercentValue(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value}%`;
}
