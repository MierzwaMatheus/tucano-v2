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
    status: "paid",
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
    .collect();

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
    .collect();
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
  },
  handler: async (ctx, args) => {
    return await addTransaction(
      ctx.db,
      args.userId,
      args.type,
      args.name,
      args.amountCents,
      args.date,
      undefined,
      args.description,
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
