import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getCompetence(
  purchaseDate: number,
  isCredit: boolean,
  closingDay: number,
): { competenceMonth: number; competenceYear: number } {
  const date = new Date(purchaseDate);
  const day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  if (isCredit && day >= closingDay) {
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return { competenceMonth: month, competenceYear: year };
}

export const listByPeriod = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_user_period", (q) =>
        q
          .eq("userId", userId)
          .eq("competenceYear", args.year)
          .eq("competenceMonth", args.month),
      )
      .order("desc")
      .collect();

    return await Promise.all(
      txs.map(async (tx) => ({
        ...tx,
        category: tx.categoryId ? await ctx.db.get(tx.categoryId) : null,
        creditCard: tx.creditCardId ? await ctx.db.get(tx.creditCardId) : null,
      })),
    );
  },
});

export const summarize = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId)
      return { totalIncome: 0, totalExpense: 0, balance: 0, pending: 0 };

    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_user_period", (q) =>
        q
          .eq("userId", userId)
          .eq("competenceYear", args.year)
          .eq("competenceMonth", args.month),
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
  },
});

export const addTransaction = mutation({
  args: {
    type: v.union(v.literal("income"), v.literal("expense")),
    name: v.string(),
    amountCents: v.number(),
    date: v.number(),
    categoryId: v.optional(v.id("categories")),
    status: v.union(v.literal("pending"), v.literal("paid")),
    isCredit: v.boolean(),
    creditCardId: v.optional(v.id("creditCards")),
    isRecurring: v.boolean(),
    installments: v.optional(v.number()),
    includeInStats: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    let closingDay = 1;
    if (args.isCredit && args.creditCardId) {
      const card = await ctx.db.get(args.creditCardId);
      if (card) closingDay = card.closingDay;
    }

    const { competenceMonth, competenceYear } = getCompetence(
      args.date,
      args.isCredit,
      closingDay,
    );

    if (!args.isRecurring && (!args.installments || args.installments <= 1)) {
      return await ctx.db.insert("transactions", {
        userId,
        type: args.type,
        name: args.name,
        description: args.description,
        amountCents: args.amountCents,
        date: args.date,
        categoryId: args.categoryId,
        status: args.status,
        isCredit: args.isCredit,
        creditCardId: args.creditCardId,
        isRecurring: false,
        includeInStats: args.includeInStats,
        competenceMonth,
        competenceYear,
        createdAt: Date.now(),
      });
    }

    if (args.isRecurring) {
      const groupId = generateId();
      let m = competenceMonth;
      let y = competenceYear;
      const inserts = [];
      for (let i = 0; i < 12; i++) {
        inserts.push(
          ctx.db.insert("transactions", {
            userId,
            type: args.type,
            name: args.name,
            description: args.description,
            amountCents: args.amountCents,
            date: args.date,
            categoryId: args.categoryId,
            status: i === 0 ? args.status : "pending",
            isCredit: args.isCredit,
            creditCardId: args.creditCardId,
            isRecurring: true,
            recurringGroupId: groupId,
            includeInStats: args.includeInStats,
            competenceMonth: m,
            competenceYear: y,
            createdAt: Date.now(),
          }),
        );
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
      await Promise.all(inserts);
      return groupId;
    }

    if (args.installments && args.installments > 1) {
      const groupId = generateId();
      const perInstallment = Math.floor(args.amountCents / args.installments);
      const lastInstallment =
        args.amountCents - perInstallment * (args.installments - 1);
      let m = competenceMonth;
      let y = competenceYear;
      const inserts = [];
      for (let i = 0; i < args.installments; i++) {
        inserts.push(
          ctx.db.insert("transactions", {
            userId,
            type: args.type,
            name: args.name,
            description: args.description,
            amountCents:
              i === args.installments - 1 ? lastInstallment : perInstallment,
            date: args.date,
            categoryId: args.categoryId,
            status: i === 0 ? args.status : "pending",
            isCredit: args.isCredit,
            creditCardId: args.creditCardId,
            isRecurring: false,
            installmentGroupId: groupId,
            installmentNumber: i + 1,
            totalInstallments: args.installments,
            includeInStats: args.includeInStats,
            competenceMonth: m,
            competenceYear: y,
            createdAt: Date.now(),
          }),
        );
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
      await Promise.all(inserts);
      return groupId;
    }
  },
});

export const toggleStatus = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const tx = await ctx.db.get(args.id);
    if (!tx) throw new Error("Transação não encontrada");

    await ctx.db.patch(args.id, {
      status: tx.status === "paid" ? "pending" : "paid",
    });
  },
});

export const editTransaction = mutation({
  args: {
    id: v.id("transactions"),
    name: v.optional(v.string()),
    amountCents: v.optional(v.number()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    status: v.optional(v.union(v.literal("pending"), v.literal("paid"))),
    includeInStats: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const deleteTransaction = mutation({
  args: {
    id: v.id("transactions"),
    mode: v.union(v.literal("single"), v.literal("thisAndFuture")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const tx = await ctx.db.get(args.id);
    if (!tx) throw new Error("Transação não encontrada");

    if (
      args.mode === "single" ||
      (!tx.recurringGroupId && !tx.installmentGroupId)
    ) {
      return await ctx.db.delete(args.id);
    }

    const isRecurring = !!tx.recurringGroupId;
    const groupId = tx.recurringGroupId ?? tx.installmentGroupId;
    const indexName = isRecurring
      ? "by_recurring_group"
      : "by_installment_group";

    const siblings = await ctx.db
      .query("transactions")
      .withIndex(indexName, (q) =>
        isRecurring
          ? q.eq("recurringGroupId", groupId)
          : q.eq("installmentGroupId", groupId),
      )
      .collect();

    const toDelete = siblings.filter(
      (t) =>
        t.competenceYear > tx.competenceYear ||
        (t.competenceYear === tx.competenceYear &&
          t.competenceMonth >= tx.competenceMonth),
    );

    await Promise.all(toDelete.map((t) => ctx.db.delete(t._id)));
  },
});
