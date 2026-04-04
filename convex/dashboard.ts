import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

/**
 * Dashboard data query with N+1 query optimizations.
 *
 * This query aggregates financial data across multiple months including:
 * - Income/expense overview with 3-month averages
 * - Price evolution for repeated shopping items
 * - Spending breakdown by category
 * - Balance history over 6 months
 * - Recurring item identification
 *
 * Performance optimizations:
 * - Batch fetch categories (1 query instead of N)
 * - Batch fetch shopping items with memory grouping (1 query instead of N×M)
 * - Parallel fetch catalog items (acceptable for < 100 items)
 *
 * @see docs/dashboard-performance.md for detailed implementation notes
 */

// Hard limits to ensure consistent performance and prevent memory exhaustion
// See docs/dashboard-performance.md#hard-limits for rationale
const LIMITS = {
  TRANSACTIONS_PER_MONTH: 500,
  LISTS_PER_MONTH: 50,
  ITEMS_PER_LIST: 100,
  TOTAL_SHOPPING_ITEMS: 5000,
  TOP_ITEMS: 5,
  RECURRING_ITEMS: 10,
  RECURRING_THRESHOLD: 3,
  PRICE_HISTORY_WINDOW: 10,
} as const;

interface PriceHistoryEntry {
  priceCents: number;
  date: number;
  listId: Id<"shoppingLists">;
}

interface PriceImpact {
  name: string;
  quantity: number;
  oldPrice: number;
  newPrice: number;
  deltaCents: number;
}

interface PriceChange {
  name: string;
  oldPrice: number;
  newPrice: number;
  deltaPercent: number;
  deltaCents: number;
}

interface CategorySpending {
  categoryId: string;
  name: string;
  color?: string;
  icon?: string;
  amountCents: number;
  count: number;
  percentageOfTotal: number;
}

interface BalanceHistoryItem {
  month: number;
  year: number;
  balanceCents: number;
}

interface AvgPriceHistoryItem {
  month: number;
  year: number;
  avgPrice: number;
}

interface RecurringItem {
  name: string;
  unit: string;
  purchasedInLast6Months: number;
  avgMonthlySpendCents: number;
  boughtThisMonth: boolean;
  lastPrice: number;
}

interface Overview {
  currentMonth: {
    income: number;
    expense: number;
    balance: number;
    pending: number;
  };
  previous3MonthsAvg: {
    income: number;
    expense: number;
    balance: number;
  };
  trend: {
    income: "up" | "down";
    expense: "up" | "down";
  };
}

interface PriceEvolution {
  repeatedItemsImpact: PriceImpact[];
  totalRepeatedItemsDeltaCents: number;
  topIncreases: PriceChange[];
  topDecreases: PriceChange[];
  avgPriceHistory: AvgPriceHistoryItem[];
}

interface DashboardData {
  overview: Overview;
  priceEvolution: PriceEvolution;
  spendingByCategory: CategorySpending[];
  balanceHistory: BalanceHistoryItem[];
  recurringItems: RecurringItem[];
  averageTicketCents: number;
}

function getPreviousMonth(
  month: number,
  year: number,
  offset: number,
): { month: number; year: number } {
  const d = new Date(year, month - 1 - offset, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function calculateAvgPrice(priceHistory: PriceHistoryEntry[]): number {
  const recent = priceHistory.slice(-LIMITS.PRICE_HISTORY_WINDOW);
  if (recent.length === 0) return 0;
  return recent.reduce((sum, p) => sum + p.priceCents, 0) / recent.length;
}

function calculatePriceDelta(
  currentPrice: number,
  avgPrice: number,
  quantity: number,
): { deltaCents: number; deltaPercent: number } {
  if (avgPrice === 0) return { deltaCents: 0, deltaPercent: 0 };
  const deltaCents = Math.round((currentPrice - avgPrice) * quantity);
  const deltaPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
  return { deltaCents, deltaPercent };
}

export const getDashboardData = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args): Promise<DashboardData | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const { month, year } = args;

    const getTransactionsByPeriod = async (
      m: number,
      y: number,
      limit = LIMITS.TRANSACTIONS_PER_MONTH,
    ) => {
      return await ctx.db
        .query("transactions")
        .withIndex("by_user_period", (q) =>
          q
            .eq("userId", userId)
            .eq("competenceYear", y)
            .eq("competenceMonth", m),
        )
        .take(limit);
    };

    const getShoppingListsByPeriod = async (m: number, y: number) => {
      return await ctx.db
        .query("shoppingLists")
        .withIndex("by_user_month", (q) =>
          q.eq("userId", userId).eq("year", y).eq("month", m),
        )
        .take(LIMITS.LISTS_PER_MONTH);
    };

    const [
      currentMonthTxs,
      currentMonthLists,
      prev1,
      prev2,
      prev3,
      prev4,
      prev5,
    ] = await Promise.all([
      getTransactionsByPeriod(month, year),
      getShoppingListsByPeriod(month, year),
      getTransactionsByPeriod(
        getPreviousMonth(month, year, 1).month,
        getPreviousMonth(month, year, 1).year,
      ),
      getTransactionsByPeriod(
        getPreviousMonth(month, year, 2).month,
        getPreviousMonth(month, year, 2).year,
      ),
      getTransactionsByPeriod(
        getPreviousMonth(month, year, 3).month,
        getPreviousMonth(month, year, 3).year,
      ),
      getTransactionsByPeriod(
        getPreviousMonth(month, year, 4).month,
        getPreviousMonth(month, year, 4).year,
      ),
      getTransactionsByPeriod(
        getPreviousMonth(month, year, 5).month,
        getPreviousMonth(month, year, 5).year,
      ),
    ]);

    const allPreviousTxs = [prev1, prev2, prev3, prev4, prev5].flat();
    const allTxs = [...currentMonthTxs, ...allPreviousTxs];

    const categoryMap = new Map<string, { amount: number; count: number }>();
    let currentIncome = 0;
    let currentExpense = 0;
    let currentPending = 0;
    let previousIncome = 0;
    let previousExpense = 0;
    const monthlyBalances = new Map<
      string,
      { income: number; expense: number }
    >();

    for (const tx of allTxs) {
      const key = `${tx.competenceYear}-${tx.competenceMonth}`;
      const monthData = monthlyBalances.get(key) || { income: 0, expense: 0 };

      if (tx.type === "income") {
        if (tx.competenceYear === year && tx.competenceMonth === month) {
          currentIncome += tx.amountCents;
        } else {
          previousIncome += tx.amountCents;
        }
        monthData.income += tx.amountCents;
      } else {
        if (tx.competenceYear === year && tx.competenceMonth === month) {
          currentExpense += tx.amountCents;
          if (tx.status === "pending") {
            currentPending += tx.amountCents;
          }
        } else {
          previousExpense += tx.amountCents;
        }
        monthData.expense += tx.amountCents;
      }

      if (tx.categoryId && tx.includeInStats) {
        const prev = categoryMap.get(tx.categoryId.toString()) || {
          amount: 0,
          count: 0,
        };
        categoryMap.set(tx.categoryId.toString(), {
          amount: prev.amount + tx.amountCents,
          count: prev.count + 1,
        });
      }

      monthlyBalances.set(key, monthData);
    }

    const overview: Overview = {
      currentMonth: {
        income: currentIncome,
        expense: currentExpense,
        balance: currentIncome - currentExpense,
        pending: currentPending,
      },
      previous3MonthsAvg: {
        income: Math.round(previousIncome / 3),
        expense: Math.round(previousExpense / 3),
        balance: Math.round((previousIncome - previousExpense) / 3),
      },
      trend: {
        income: currentIncome > previousIncome / 3 ? "up" : "down",
        expense: currentExpense > previousExpense / 3 ? "up" : "down",
      },
    };

    const allListsPromises = [];
    for (let i = 1; i <= 6; i++) {
      const { month: m, year: y } = getPreviousMonth(month, year, i);
      allListsPromises.push(getShoppingListsByPeriod(m, y));
    }
    const allListsResults = await Promise.all(allListsPromises);
    const allLists = allListsResults.flat();

    const allShoppingItems = await ctx.db
      .query("shoppingItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(LIMITS.TOTAL_SHOPPING_ITEMS);

    const itemsByListId = new Map<string, typeof allShoppingItems>();
    for (const item of allShoppingItems) {
      const listKey = item.listId.toString();
      const existing = itemsByListId.get(listKey) || [];
      existing.push(item);
      itemsByListId.set(listKey, existing);
    }

    const itemsByCatalog = new Map<string, { qty: number }>();

    for (const item of allShoppingItems) {
      if (item.catalogItemId) {
        const key = item.catalogItemId.toString();
        const existing = itemsByCatalog.get(key) || { qty: 0 };
        existing.qty += item.quantity;
        itemsByCatalog.set(key, existing);
      }
    }

    const catalogIds = Array.from(itemsByCatalog.keys());
    const catalogItems = await Promise.all(
      catalogIds.map((id) => ctx.db.get(id as Id<"productCatalog">)),
    );
    const catalogMap = new Map(
      catalogItems.filter(Boolean).map((item) => [item!._id.toString(), item!]),
    );

    const currentMonthListIds = new Set(
      currentMonthLists.map((l) => l._id.toString()),
    );
    const flattenedCurrentItems = allShoppingItems.filter((item) =>
      currentMonthListIds.has(item.listId.toString()),
    );

    const repeatedItemsImpact: PriceImpact[] = [];
    const topIncreases: PriceChange[] = [];
    const topDecreases: PriceChange[] = [];

    for (const [catalogId] of itemsByCatalog) {
      const catalog = catalogMap.get(catalogId);
      if (
        !catalog ||
        !catalog.priceHistory ||
        catalog.priceHistory.length < 2
      ) {
        continue;
      }

      const avgHistoricalPrice = calculateAvgPrice(catalog.priceHistory);
      const currentItem = flattenedCurrentItems.find(
        (i) => i.catalogItemId?.toString() === catalogId,
      );

      if (currentItem) {
        const { deltaCents } = calculatePriceDelta(
          currentItem.unitPriceCents,
          avgHistoricalPrice,
          currentItem.quantity,
        );

        if (deltaCents !== 0) {
          repeatedItemsImpact.push({
            name: catalog.name,
            quantity: currentItem.quantity,
            oldPrice: Math.round(avgHistoricalPrice),
            newPrice: currentItem.unitPriceCents,
            deltaCents,
          });
        }
      }

      const currentPrice = catalog.lastPriceCents;
      const { deltaCents, deltaPercent } = calculatePriceDelta(
        currentPrice,
        avgHistoricalPrice,
        1,
      );

      if (deltaPercent > 0) {
        topIncreases.push({
          name: catalog.name,
          oldPrice: Math.round(avgHistoricalPrice),
          newPrice: currentPrice,
          deltaPercent: Math.round(deltaPercent * 10) / 10,
          deltaCents: Math.round(deltaCents),
        });
      } else if (deltaPercent < 0) {
        topDecreases.push({
          name: catalog.name,
          oldPrice: Math.round(avgHistoricalPrice),
          newPrice: currentPrice,
          deltaPercent: Math.round(deltaPercent * 10) / 10,
          deltaCents: Math.round(deltaCents),
        });
      }
    }

    repeatedItemsImpact.sort(
      (a, b) => Math.abs(b.deltaCents) - Math.abs(a.deltaCents),
    );
    topIncreases.sort((a, b) => b.deltaPercent - a.deltaPercent);
    topDecreases.sort((a, b) => a.deltaPercent - b.deltaPercent);

    const avgPriceHistory: AvgPriceHistoryItem[] = [];

    for (let i = 5; i >= 0; i--) {
      const { month: m, year: y } = getPreviousMonth(month, year, i);
      const listsInMonth = allLists.filter(
        (l) => l.month === m && l.year === y && l.status === "completed",
      );

      let totalPrice = 0;
      let itemCount = 0;

      for (const list of listsInMonth) {
        const items = itemsByListId.get(list._id.toString()) || [];
        for (const item of items) {
          totalPrice += item.unitPriceCents * item.quantity;
          itemCount += item.quantity;
        }
      }

      avgPriceHistory.push({
        month: m,
        year: y,
        avgPrice: itemCount > 0 ? Math.round(totalPrice / itemCount) : 0,
      });
    }

    const allCategories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const categoryMapFromDb = new Map(
      allCategories.map((cat) => [cat._id.toString(), cat]),
    );

    const spendingByCategory: CategorySpending[] = [];
    for (const [catId, data] of categoryMap) {
      const category = categoryMapFromDb.get(catId);
      if (category) {
        spendingByCategory.push({
          categoryId: catId,
          name: category.name,
          color: category.color,
          icon: category.icon,
          amountCents: data.amount,
          count: data.count,
          percentageOfTotal: 0,
        });
      }
    }

    spendingByCategory.sort((a, b) => b.amountCents - a.amountCents);
    const totalCategorySpent = spendingByCategory.reduce(
      (sum, c) => sum + c.amountCents,
      0,
    );

    for (const cat of spendingByCategory) {
      cat.percentageOfTotal =
        totalCategorySpent > 0
          ? Math.round((cat.amountCents / totalCategorySpent) * 1000) / 10
          : 0;
    }

    const balanceHistory: BalanceHistoryItem[] = [];
    for (let i = 5; i >= 0; i--) {
      const { month: m, year: y } = getPreviousMonth(month, year, i);
      const key = `${y}-${m}`;
      const monthData = monthlyBalances.get(key) || { income: 0, expense: 0 };
      balanceHistory.push({
        month: m,
        year: y,
        balanceCents: monthData.income - monthData.expense,
      });
    }

    const recurringItems: RecurringItem[] = [];
    const catalogPurchaseCount = new Map<string, number>();

    for (const item of allShoppingItems) {
      if (item.catalogItemId) {
        const key = item.catalogItemId.toString();
        const count = catalogPurchaseCount.get(key) || 0;
        catalogPurchaseCount.set(key, count + 1);
      }
    }

    for (const [catalogId, count] of catalogPurchaseCount) {
      const catalog = catalogMap.get(catalogId);
      if (catalog && count >= LIMITS.RECURRING_THRESHOLD) {
        const currentMonthItem = flattenedCurrentItems.find(
          (i) => i.catalogItemId?.toString() === catalogId,
        );

        recurringItems.push({
          name: catalog.name,
          unit: catalog.defaultUnit,
          purchasedInLast6Months: count,
          avgMonthlySpendCents: Math.round(
            (catalog.lastPriceCents * count) / 6,
          ),
          boughtThisMonth: !!currentMonthItem,
          lastPrice: catalog.lastPriceCents,
        });
      }
    }

    recurringItems.sort(
      (a, b) => b.purchasedInLast6Months - a.purchasedInLast6Months,
    );

    const completedListsThisMonth = currentMonthLists.filter(
      (l) => l.status === "completed",
    );
    const averageTicketCents =
      completedListsThisMonth.length > 0
        ? Math.round(
            completedListsThisMonth.reduce((sum, l) => sum + l.totalCents, 0) /
              completedListsThisMonth.length,
          )
        : 0;

    return {
      overview,
      priceEvolution: {
        repeatedItemsImpact: repeatedItemsImpact.slice(0, LIMITS.TOP_ITEMS),
        totalRepeatedItemsDeltaCents: repeatedItemsImpact.reduce(
          (sum, i) => sum + i.deltaCents,
          0,
        ),
        topIncreases: topIncreases.slice(0, LIMITS.TOP_ITEMS),
        topDecreases: topDecreases.slice(0, LIMITS.TOP_ITEMS),
        avgPriceHistory,
      },
      spendingByCategory,
      balanceHistory,
      recurringItems: recurringItems.slice(0, LIMITS.RECURRING_ITEMS),
      averageTicketCents,
    };
  },
});
