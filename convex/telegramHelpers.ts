import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import {
  DatabaseReader,
  DatabaseWriter,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { generateId, getCompetence } from "./transactions";

export async function findUserByTelegramId(
  db: DatabaseReader,
  telegramId: string,
): Promise<Doc<"users"> | null> {
  return await db
    .query("users")
    .withIndex("by_telegram_id", (q) => q.eq("telegramId", telegramId))
    .first();
}

export async function findActiveShoppingList(
  db: DatabaseReader,
  userId: Id<"users">,
  listName?: string,
  month?: number,
  year?: number,
): Promise<Doc<"shoppingLists"> | null> {
  if (listName) {
    const lists = await db
      .query("shoppingLists")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "active"),
      )
      .collect();

    const match = lists.find((l) =>
      l.name.toLowerCase().includes(listName.toLowerCase()),
    );
    if (match) return match;
  }

  if (month && year) {
    return await db
      .query("shoppingLists")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", userId).eq("year", year).eq("month", month),
      )
      .first();
  }

  return await db
    .query("shoppingLists")
    .withIndex("by_user_status", (q) =>
      q.eq("userId", userId).eq("status", "active"),
    )
    .order("desc")
    .first();
}

export async function createShoppingList(
  db: DatabaseWriter,
  userId: Id<"users">,
  name: string,
  month: number,
  year: number,
  budgetCents: number = 0,
): Promise<Id<"shoppingLists">> {
  return await db.insert("shoppingLists", {
    userId,
    name,
    month,
    year,
    budgetCents,
    totalCents: 0,
    status: "active",
    createdAt: Date.now(),
  });
}

export async function addShoppingItem(
  db: DatabaseWriter,
  userId: Id<"users">,
  listId: Id<"shoppingLists">,
  name: string,
  unit: string,
  quantity: number,
  unitPriceCents: number,
  categoryId?: Id<"categories">,
): Promise<void> {
  const totalCents = Math.round(unitPriceCents * quantity);

  await db.insert("shoppingItems", {
    listId,
    userId,
    name,
    unit,
    quantity,
    unitPriceCents,
    totalCents,
    isPurchased: false,
    categoryId,
    createdAt: Date.now(),
  });

  const list = await db.get(listId);
  if (list) {
    await db.patch(listId, {
      totalCents: list.totalCents + totalCents,
    });
  }
}

export async function addTransaction(
  db: DatabaseWriter,
  userId: Id<"users">,
  type: "income" | "expense",
  name: string,
  amountCents: number,
  date: number,
  categoryId?: Id<"categories">,
  description?: string,
  isCredit: boolean = false,
  status: "pending" | "paid" = "pending",
): Promise<Id<"transactions">> {
  const { competenceMonth, competenceYear } = getCompetence(date, isCredit, 1);

  return await db.insert("transactions", {
    userId,
    type,
    name,
    description,
    amountCents,
    date,
    categoryId,
    status,
    isCredit,
    isRecurring: false,
    includeInStats: true,
    competenceMonth,
    competenceYear,
    createdAt: Date.now(),
  });
}

export async function getMonthSummary(
  db: DatabaseReader,
  userId: Id<"users">,
  month: number,
  year: number,
): Promise<{
  totalIncome: number;
  totalExpense: number;
  balance: number;
  pending: number;
}> {
  const txs = await db
    .query("transactions")
    .withIndex("by_user_period", (q) =>
      q
        .eq("userId", userId)
        .eq("competenceYear", year)
        .eq("competenceMonth", month),
    )
    .filter((q) => q.eq(q.field("includeInStats"), true))
    .take(50);

  let totalIncome = 0;
  let totalExpense = 0;
  let totalPaid = 0;
  let totalPending = 0;

  for (const tx of txs) {
    if (tx.type === "income") {
      totalIncome += tx.amountCents;
    } else {
      totalExpense += tx.amountCents;
      if (tx.status === "paid") totalPaid += tx.amountCents;
      if (tx.status === "pending") totalPending += tx.amountCents;
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalPaid,
    pending: totalPending,
  };
}

export async function getUserActiveLists(
  db: DatabaseReader,
  userId: Id<"users">,
): Promise<Doc<"shoppingLists">[]> {
  return await db
    .query("shoppingLists")
    .withIndex("by_user_status", (q) =>
      q.eq("userId", userId).eq("status", "active"),
    )
    .take(50);
}

export const findActiveShoppingListInternal = internalQuery({
  args: {
    userId: v.id("users"),
    listName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const list = await findActiveShoppingList(
      ctx.db,
      args.userId,
      args.listName,
    );
    return list?._id ?? null;
  },
});

export const createShoppingListInternal = internalMutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    month: v.number(),
    year: v.number(),
    budgetCents: v.number(),
  },
  handler: async (ctx, args) => {
    return await createShoppingList(
      ctx.db,
      args.userId,
      args.name,
      args.month,
      args.year,
      args.budgetCents,
    );
  },
});

export const addShoppingItemInternal = internalMutation({
  args: {
    userId: v.id("users"),
    listId: v.id("shoppingLists"),
    name: v.string(),
    unit: v.string(),
    quantity: v.number(),
    unitPriceCents: v.number(),
  },
  handler: async (ctx, args) => {
    await addShoppingItem(
      ctx.db,
      args.userId,
      args.listId,
      args.name,
      args.unit,
      args.quantity,
      args.unitPriceCents,
    );
  },
});

export const addTransactionInternal = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("income"), v.literal("expense")),
    name: v.string(),
    amountCents: v.number(),
    date: v.number(),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    status: v.optional(v.union(v.literal("pending"), v.literal("paid"))),
  },
  handler: async (ctx, args) => {
    return await addTransaction(
      ctx.db,
      args.userId,
      args.type,
      args.name,
      args.amountCents,
      args.date,
      args.categoryId,
      args.description,
      false,
      args.status ?? "pending",
    );
  },
});

export const getMonthSummaryInternal = internalQuery({
  args: {
    userId: v.id("users"),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    return await getMonthSummary(ctx.db, args.userId, args.month, args.year);
  },
});

export const getUserActiveListsInternal = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await getUserActiveLists(ctx.db, args.userId);
  },
});

export const findUserByTelegramIdInternal = internalQuery({
  args: {
    telegramId: v.string(),
  },
  handler: async (ctx, args) => {
    return await findUserByTelegramId(ctx.db, args.telegramId);
  },
});

export const linkTelegramIdInternal = internalMutation({
  args: {
    userId: v.id("users"),
    telegramId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      telegramId: args.telegramId,
    });
  },
});

export const getCreditCardsInternal = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("creditCards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .collect();
  },
});

export const getCategoriesInternal = internalQuery({
  args: {
    userId: v.id("users"),
    type: v.optional(
      v.union(
        v.literal("shopping"),
        v.literal("income"),
        v.literal("expense"),
        v.literal("all"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { userId, type } = args;
    if (type) {
      return await ctx.db
        .query("categories")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", userId).eq("type", type),
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }
    return await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const findCategoryByNameInternal = internalQuery({
  args: {
    userId: v.id("users"),
    categoryName: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, categoryName } = args;
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const match = categories.find((c) =>
      c.name.toLowerCase().includes(categoryName.toLowerCase()),
    );
    return match?._id ?? null;
  },
});

export const findCreditCardByNameInternal = internalQuery({
  args: {
    userId: v.id("users"),
    cardName: v.string(),
  },
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("creditCards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .collect();

    const searchName = args.cardName.toLowerCase();
    const match = cards.find(
      (c) =>
        c.name.toLowerCase().includes(searchName) ||
        searchName.includes(c.name.toLowerCase()),
    );
    return match?._id ?? null;
  },
});

export const addTransactionFullInternal = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("income"), v.literal("expense")),
    name: v.string(),
    amountCents: v.number(),
    date: v.number(),
    description: v.optional(v.string()),
    isCredit: v.boolean(),
    creditCardId: v.optional(v.id("creditCards")),
    installments: v.optional(v.number()),
    isRecurring: v.boolean(),
    isSubscription: v.optional(v.boolean()),
    competenceMonth: v.number(),
    competenceYear: v.number(),
    categoryId: v.optional(v.id("categories")),
    status: v.optional(v.union(v.literal("pending"), v.literal("paid"))),
  },
  handler: async (ctx, args) => {
    const {
      userId,
      isCredit,
      creditCardId,
      installments,
      isRecurring,
      isSubscription,
      competenceMonth,
      competenceYear,
      status,
      ...rest
    } = args;

    const baseTransaction = {
      ...rest,
      userId,
      isCredit,
      creditCardId,
      includeInStats: true,
      categoryId: args.categoryId,
      description: args.description,
      status: status ?? (isCredit ? "pending" : "paid"),
    };

    if (isRecurring && isSubscription) {
      const groupId =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      const inserts = [];
      for (let i = 0; i < 12; i++) {
        const compMonth = ((competenceMonth - 1 + i) % 12) + 1;
        const compYear =
          competenceYear + Math.floor((competenceMonth - 1 + i) / 12);
        inserts.push(
          ctx.db.insert("transactions", {
            ...baseTransaction,
            status: "pending",
            isRecurring: true,
            isSubscription: true,
            recurringGroupId: groupId,
            competenceMonth: compMonth,
            competenceYear: compYear,
            createdAt: Date.now(),
          }),
        );
      }
      await Promise.all(inserts);
      return groupId;
    }

    if (installments && installments > 1) {
      const groupId =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      const perInstallment = Math.floor(args.amountCents / installments);
      const lastInstallment =
        args.amountCents - perInstallment * (installments - 1);
      const inserts = [];
      for (let i = 0; i < installments; i++) {
        const compMonth = ((competenceMonth - 1 + i) % 12) + 1;
        const compYear =
          competenceYear + Math.floor((competenceMonth - 1 + i) / 12);
        const installmentAmount =
          i === installments - 1 ? lastInstallment : perInstallment;
        inserts.push(
          ctx.db.insert("transactions", {
            ...baseTransaction,
            amountCents: installmentAmount,
            isRecurring: false,
            installmentGroupId: groupId,
            installmentNumber: i + 1,
            totalInstallments: installments,
            status: "pending",
            competenceMonth: compMonth,
            competenceYear: compYear,
            createdAt: Date.now(),
          }),
        );
      }
      await Promise.all(inserts);
      return groupId;
    }

    return await ctx.db.insert("transactions", {
      ...baseTransaction,
      isRecurring: isRecurring ?? false,
      status: "paid",
      competenceMonth,
      competenceYear,
      createdAt: Date.now(),
    });
  },
});

export const getTransactionsInternal = internalQuery({
  args: {
    userId: v.id("users"),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    cardId: v.optional(v.id("creditCards")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, month, year, type, cardId, limit } = args;
    const queryLimit = limit ?? 50;

    let results;
    if (month && year) {
      results = await ctx.db
        .query("transactions")
        .withIndex("by_user_period", (q) =>
          q
            .eq("userId", userId)
            .eq("competenceYear", year)
            .eq("competenceMonth", month),
        )
        .take(queryLimit);
    } else {
      results = await ctx.db
        .query("transactions")
        .filter((q) => q.eq(q.field("userId"), userId))
        .take(queryLimit);
    }

    if (type) {
      results = results.filter((t) => t.type === type);
    }
    if (cardId) {
      results = results.filter((t) => t.creditCardId === cardId);
    }

    results = results.sort((a, b) => b.date - a.date);

    if (limit) {
      results = results.slice(0, limit);
    }

    return results;
  },
});

export const getTransactionsByCardInternal = internalQuery({
  args: {
    userId: v.id("users"),
    cardId: v.id("creditCards"),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, cardId, month, year } = args;
    return await ctx.db
      .query("transactions")
      .withIndex("by_card_period", (q) =>
        q
          .eq("creditCardId", cardId)
          .eq("competenceYear", year)
          .eq("competenceMonth", month),
      )
      .take(50);
  },
});

export const getShoppingListItemsInternal = internalQuery({
  args: {
    listId: v.id("shoppingLists"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shoppingItems")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .take(50);
  },
});

export const getAllShoppingListsInternal = internalQuery({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    const { userId, status } = args;
    if (status) {
      return await ctx.db
        .query("shoppingLists")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", userId).eq("status", status),
        )
        .take(50);
    }
    return await ctx.db
      .query("shoppingLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(50);
  },
});
