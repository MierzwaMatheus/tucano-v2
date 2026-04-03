import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("shoppingLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getWithItems = query({
  args: { listId: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const [list, items] = await Promise.all([
      ctx.db.get(args.listId),
      ctx.db
        .query("shoppingItems")
        .withIndex("by_list", (q) => q.eq("listId", args.listId))
        .collect(),
    ]);

    if (!list || list.userId !== userId) return null;

    const itemsWithCategory = await Promise.all(
      items.map(async (item) => ({
        ...item,
        category: item.categoryId ? await ctx.db.get(item.categoryId) : null,
      })),
    );

    return { ...list, items: itemsWithCategory };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    month: v.number(),
    year: v.number(),
    budgetCents: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    return await ctx.db.insert("shoppingLists", {
      userId,
      name: args.name,
      month: args.month,
      year: args.year,
      budgetCents: args.budgetCents,
      totalCents: 0,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("shoppingLists"),
    name: v.optional(v.string()),
    budgetCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const items = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list", (q) => q.eq("listId", args.id))
      .collect();

    await Promise.all(items.map((item) => ctx.db.delete(item._id)));
    await ctx.db.delete(args.id);
  },
});

export const reopen = mutation({
  args: { id: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const list = await ctx.db.get(args.id);
    if (!list || list.userId !== userId)
      throw new Error("Lista não encontrada");

    if (list.transactionId) {
      await ctx.db.delete(list.transactionId);
    }

    await ctx.db.patch(args.id, {
      status: "active",
      completedAt: undefined,
      transactionId: undefined,
    });
  },
});

export const complete = mutation({
  args: {
    id: v.id("shoppingLists"),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const list = await ctx.db.get(args.id);
    if (!list || list.userId !== userId)
      throw new Error("Lista não encontrada");

    if (list.status === "completed") return list.transactionId;

    const completedAt = args.completedAt ?? Date.now();

    const txId = await ctx.db.insert("transactions", {
      userId,
      type: "expense",
      name: list.name,
      amountCents: list.totalCents,
      date: completedAt,
      status: "paid",
      isCredit: false,
      isRecurring: false,
      includeInStats: true,
      competenceMonth: list.month,
      competenceYear: list.year,
      createdAt: completedAt,
    });

    await ctx.db.patch(args.id, {
      status: "completed",
      completedAt,
      transactionId: txId,
    });

    return txId;
  },
});
