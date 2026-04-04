import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("creditCards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    closingDay: v.number(),
    paymentDay: v.number(),
    color: v.optional(v.string()),
    creditLimitCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    return await ctx.db.insert("creditCards", {
      userId,
      name: args.name,
      closingDay: args.closingDay,
      paymentDay: args.paymentDay,
      color: args.color,
      creditLimitCents: args.creditLimitCents,
      isEnabled: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("creditCards"),
    name: v.optional(v.string()),
    closingDay: v.optional(v.number()),
    paymentDay: v.optional(v.number()),
    color: v.optional(v.string()),
    creditLimitCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const disable = mutation({
  args: { id: v.id("creditCards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    await ctx.db.patch(args.id, { isEnabled: false });
  },
});

export const listFatura = query({
  args: {
    cardId: v.id("creditCards"),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("transactions")
      .withIndex("by_card_period", (q) =>
        q
          .eq("creditCardId", args.cardId)
          .eq("competenceYear", args.year)
          .eq("competenceMonth", args.month),
      )
      .collect();
  },
});

export const payFatura = mutation({
  args: {
    cardId: v.id("creditCards"),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const items = await ctx.db
      .query("transactions")
      .withIndex("by_card_period", (q) =>
        q
          .eq("creditCardId", args.cardId)
          .eq("competenceYear", args.year)
          .eq("competenceMonth", args.month),
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    await Promise.all(
      items.map((t) => ctx.db.patch(t._id, { status: "paid" })),
    );
  },
});
