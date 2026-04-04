import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  BarChart3,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatBRL } from "../lib/currency";
import { formatPercent, formatDiff } from "../lib/format";
import { MonthNavigator } from "../components/MonthNavigator";
import { DASHBOARD_LABELS } from "../lib/ui-strings";

// Minimum bar height in pixels for chart visualization
const MIN_BAR_HEIGHT = 4;

export function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const dashboard = useQuery(api.dashboard.getDashboardData, { month, year });

  const maxBalance = useMemo(() => {
    if (!dashboard?.balanceHistory?.length) return 1;
    return Math.max(
      ...dashboard.balanceHistory.map((b) => Math.abs(b.balanceCents)),
      1,
    );
  }, [dashboard]);

  const maxCategory = useMemo(() => {
    if (!dashboard?.spendingByCategory?.length) return 1;
    return Math.max(
      ...dashboard.spendingByCategory.map((c) => c.amountCents),
      1,
    );
  }, [dashboard]);

  const maxPrice = useMemo(() => {
    if (!dashboard?.priceEvolution?.avgPriceHistory?.length) return 1;
    return Math.max(
      ...dashboard.priceEvolution.avgPriceHistory.map((p) => p.avgPrice),
      1,
    );
  }, [dashboard]);

  if (!dashboard) {
    return (
      <div className="p-4 pb-24 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-elevated rounded-card w-1/3" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-surface-elevated rounded-card" />
            <div className="h-24 bg-surface-elevated rounded-card" />
            <div className="h-24 bg-surface-elevated rounded-card" />
            <div className="h-24 bg-surface-elevated rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  const {
    overview,
    priceEvolution,
    spendingByCategory,
    balanceHistory,
    recurringItems,
    averageTicketCents,
  } = dashboard;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text-primary">
          {DASHBOARD_LABELS.TITLE}
        </h1>
      </div>

      <div className="flex justify-center mb-5">
        <MonthNavigator
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <OverviewCard
          label={DASHBOARD_LABELS.INCOMES}
          value={overview.currentMonth.income}
          trend={overview.trend.income}
          diff={formatDiff(
            overview.currentMonth.income,
            overview.previous3MonthsAvg.income,
          )}
          diffPercent={
            overview.previous3MonthsAvg.income > 0
              ? Math.round(
                  ((overview.currentMonth.income -
                    overview.previous3MonthsAvg.income) /
                    overview.previous3MonthsAvg.income) *
                    100,
                )
              : 0
          }
          icon={<TrendingUp size={18} />}
          color="text-status-success"
          bg="bg-status-success/10"
        />
        <OverviewCard
          label={DASHBOARD_LABELS.EXPENSES}
          value={overview.currentMonth.expense}
          trend={overview.trend.expense}
          diff={formatDiff(
            overview.currentMonth.expense,
            overview.previous3MonthsAvg.expense,
          )}
          diffPercent={
            overview.previous3MonthsAvg.expense > 0
              ? Math.round(
                  ((overview.currentMonth.expense -
                    overview.previous3MonthsAvg.expense) /
                    overview.previous3MonthsAvg.expense) *
                    100,
                )
              : 0
          }
          icon={<TrendingDown size={18} />}
          color="text-status-error"
          bg="bg-status-error/10"
        />
        <OverviewCard
          label={DASHBOARD_LABELS.BALANCE}
          value={overview.currentMonth.balance}
          diff={formatDiff(
            overview.currentMonth.balance,
            overview.previous3MonthsAvg.balance,
          )}
          diffPercent={
            overview.previous3MonthsAvg.balance > 0
              ? Math.round(
                  ((overview.currentMonth.balance -
                    overview.previous3MonthsAvg.balance) /
                    overview.previous3MonthsAvg.balance) *
                    100,
                )
              : 0
          }
          icon={<Wallet size={18} />}
          color={
            overview.currentMonth.balance >= 0
              ? "text-accent"
              : "text-status-error"
          }
          bg="bg-accent-subtle"
        />
        <OverviewCard
          label={DASHBOARD_LABELS.AVERAGE_TICKET}
          value={averageTicketCents}
          subLabel={DASHBOARD_LABELS.PER_PURCHASE}
          icon={<ShoppingCart size={18} />}
          color="text-text-primary"
          bg="bg-surface-elevated"
        />
      </div>

      <SectionTitle
        title={DASHBOARD_LABELS.PRICE_EVOLUTION}
        icon={<BarChart3 size={16} />}
      />

      <div className="space-y-3 mb-5">
        <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-text-muted mb-1">
                {DASHBOARD_LABELS.REPEATED_ITEMS_IMPACT}
              </div>
              <div
                className={`text-xl font-bold ${
                  priceEvolution.totalRepeatedItemsDeltaCents >= 0
                    ? "text-status-error"
                    : "text-status-success"
                }`}
              >
                {formatBRL(
                  Math.abs(priceEvolution.totalRepeatedItemsDeltaCents),
                )}
                {priceEvolution.totalRepeatedItemsDeltaCents >= 0
                  ? ` ${DASHBOARD_LABELS.MORE_SPENT}`
                  : ` ${DASHBOARD_LABELS.LESS_SPENT}`}
              </div>
            </div>
            <div
              className={`p-2 rounded-button ${
                priceEvolution.totalRepeatedItemsDeltaCents >= 0
                  ? "bg-status-error/10 text-status-error"
                  : "bg-status-success/10 text-status-success"
              }`}
            >
              {priceEvolution.totalRepeatedItemsDeltaCents >= 0 ? (
                <ArrowUpRight size={20} />
              ) : (
                <ArrowDownRight size={20} />
              )}
            </div>
          </div>
          {priceEvolution.repeatedItemsImpact.length > 0 && (
            <div className="space-y-2 mt-3 pt-3 border-t border-border-subtle">
              {priceEvolution.repeatedItemsImpact.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-secondary truncate flex-1 mr-2">
                    {item.name}
                  </span>
                  <span
                    className={`font-medium ${
                      item.deltaCents >= 0
                        ? "text-status-error"
                        : "text-status-success"
                    }`}
                  >
                    {item.deltaCents >= 0 ? "+" : ""}
                    {formatBRL(item.deltaCents)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {priceEvolution.repeatedItemsImpact.length === 0 && (
            <div className="text-text-muted text-sm mt-2">
              {DASHBOARD_LABELS.NO_REPEATED_ITEMS}
            </div>
          )}
        </div>

        <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-4">
          <div className="text-xs text-text-muted mb-3">
            {DASHBOARD_LABELS.TOP_INCREASES}
          </div>
          {priceEvolution.topIncreases.length > 0 ? (
            <div className="space-y-2">
              {priceEvolution.topIncreases.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-secondary truncate flex-1 mr-2">
                    {item.name}
                  </span>
                  <span className="text-status-error font-medium">
                    {formatPercent(item.deltaPercent)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-muted text-sm">
              {DASHBOARD_LABELS.NO_INCREASES}
            </div>
          )}
        </div>

        <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-4">
          <div className="text-xs text-text-muted mb-3">
            {DASHBOARD_LABELS.TOP_DECREASES}
          </div>
          {priceEvolution.topDecreases.length > 0 ? (
            <div className="space-y-2">
              {priceEvolution.topDecreases.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-secondary truncate flex-1 mr-2">
                    {item.name}
                  </span>
                  <span className="text-status-success font-medium">
                    {formatPercent(item.deltaPercent)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-muted text-sm">
              {DASHBOARD_LABELS.NO_DECREASES}
            </div>
          )}
        </div>

        <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-4">
          <div className="text-xs text-text-muted mb-3">
            {DASHBOARD_LABELS.AVG_PRICE_EVOLUTION}
          </div>
          <div className="flex items-end gap-1 h-24">
            {priceEvolution.avgPriceHistory.map((item) => (
              <div
                key={`${item.year}-${item.month}`}
                className="flex-1 flex flex-col items-center"
              >
                <div
                  className="w-full bg-accent rounded-t-sm"
                  style={{
                    height: `${Math.max(MIN_BAR_HEIGHT, (item.avgPrice / maxPrice) * 100)}%`,
                  }}
                />
                <div className="text-[10px] text-text-muted mt-1">
                  {item.month}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionTitle
        title={DASHBOARD_LABELS.SPENDING_BY_CATEGORY}
        icon={<BarChart3 size={16} />}
      />

      <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-4 mb-5">
        {spendingByCategory.length > 0 ? (
          <div className="space-y-3">
            {spendingByCategory.map((cat) => (
              <div key={cat.categoryId}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.color && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    )}
                    <span className="text-sm text-text-primary">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-text-primary">
                    {formatBRL(cat.amountCents)}
                  </span>
                </div>
                <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{
                      width: `${(cat.amountCents / maxCategory) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-text-muted text-sm text-center py-4">
            {DASHBOARD_LABELS.NO_SPENDING_BY_CATEGORY}
          </div>
        )}
      </div>

      <SectionTitle
        title={DASHBOARD_LABELS.BALANCE_HISTORY}
        icon={<Wallet size={16} />}
      />

      <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-4 mb-5">
        <div className="flex items-end gap-1 h-24">
          {balanceHistory.map((item) => (
            <div
              key={`${item.year}-${item.month}`}
              className="flex-1 flex flex-col items-center"
            >
              <div
                className={`w-full rounded-t-sm ${
                  item.balanceCents >= 0 ? "bg-accent" : "bg-status-error"
                }`}
                style={{
                  height: `${Math.max(
                    MIN_BAR_HEIGHT,
                    (Math.abs(item.balanceCents) / maxBalance) * 100,
                  )}%`,
                }}
              />
              <div className="text-[10px] text-text-muted mt-1">
                {item.month}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle
        title={DASHBOARD_LABELS.RECURRING_ITEMS}
        icon={<Package size={16} />}
      />

      <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-4">
        {recurringItems.length > 0 ? (
          <div className="space-y-3">
            {recurringItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="text-sm text-text-primary">{item.name}</div>
                  <div className="text-xs text-text-muted">
                    {item.purchasedInLast6Months}/6{" "}
                    {DASHBOARD_LABELS.MONTHS_ABBREV} •{" "}
                    {formatBRL(item.avgMonthlySpendCents)}
                    {DASHBOARD_LABELS.PER_MONTH}
                  </div>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    item.boughtThisMonth
                      ? "bg-accent-subtle text-accent"
                      : "bg-surface-elevated text-text-muted"
                  }`}
                >
                  {item.boughtThisMonth
                    ? DASHBOARD_LABELS.BOUGHT
                    : DASHBOARD_LABELS.NOT_BOUGHT}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-text-muted text-sm text-center py-4">
            {DASHBOARD_LABELS.NO_RECURRING_ITEMS}
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  subLabel,
  diff,
  diffPercent,
  trend,
  icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  subLabel?: string;
  diff?: string;
  diffPercent?: number;
  trend?: "up" | "down";
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  const hasDiff = diff !== undefined && diffPercent !== undefined;

  return (
    <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-4">
      <div className={`inline-flex p-2 rounded-button ${bg} ${color} mb-2`}>
        {icon}
      </div>
      <div className="text-xs text-text-muted mb-0.5">{label}</div>
      <div className={`font-bold text-lg ${color}`}>{formatBRL(value)}</div>
      {subLabel && <div className="text-xs text-text-muted">{subLabel}</div>}
      {hasDiff && (
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" ? (
            <ArrowUpRight size={12} className="text-status-error" />
          ) : trend === "down" ? (
            <ArrowDownRight size={12} className="text-status-success" />
          ) : null}
          <span
            className={`text-xs ${
              (diffPercent ?? 0) >= 0
                ? "text-status-error"
                : "text-status-success"
            }`}
          >
            {diff} ({diffPercent && diffPercent >= 0 ? "+" : ""}
            {diffPercent}%)
          </span>
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-text-muted">{icon}</span>
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        {title}
      </h3>
    </div>
  );
}
