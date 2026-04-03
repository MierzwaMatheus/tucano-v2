/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("shoppingLists.complete", () => {
  test("creates transaction and marks list as completed", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const listId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingLists", {
        userId: userId as any,
        name: "Lista de teste",
        month: 4,
        year: 2026,
        budgetCents: 10000,
        totalCents: 5000,
        status: "active",
        createdAt: Date.now(),
      });
    });

    const completedAt = Date.now();
    await ctx.run(async (c) => {
      const list = await c.db.get(listId);
      if (!list) throw new Error("Lista não encontrada");

      const txId = await c.db.insert("transactions", {
        userId: list.userId,
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

      await c.db.patch(listId, {
        status: "completed",
        completedAt,
        transactionId: txId,
      });
    });

    const list = await ctx.run(async (c) => {
      return await c.db.get(listId);
    });

    expect(list?.status).toBe("completed");
    expect(list?.transactionId).not.toBeNull();

    const tx = await ctx.run(async (c) => {
      return await c.db.get(list!.transactionId!);
    });

    expect(tx?.type).toBe("expense");
    expect(tx?.amountCents).toBe(5000);
    expect(tx?.name).toBe("Lista de teste");
    expect(tx?.competenceMonth).toBe(4);
    expect(tx?.competenceYear).toBe(2026);
  });

  test("uses custom completedAt when provided", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test2@test.com" });
    const customDate = new Date("2026-01-15").getTime();

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User 2",
        email: "test2@test.com",
      });
    });

    const listId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingLists", {
        userId: userId as any,
        name: "Lista com data",
        month: 1,
        year: 2026,
        budgetCents: 5000,
        totalCents: 2000,
        status: "active",
        createdAt: Date.now(),
      });
    });

    await ctx.run(async (c) => {
      const list = await c.db.get(listId);
      if (!list) throw new Error("Lista não encontrada");

      const completedAt = customDate;
      const txId = await c.db.insert("transactions", {
        userId: list.userId,
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

      await c.db.patch(listId, {
        status: "completed",
        completedAt,
        transactionId: txId,
      });
    });

    const list = await ctx.run(async (c) => {
      return await c.db.get(listId);
    });

    expect(list?.completedAt).toBe(customDate);

    const tx = await ctx.run(async (c) => {
      return await c.db.get(list!.transactionId!);
    });

    expect(tx?.date).toBe(customDate);
    expect(tx?.createdAt).toBe(customDate);
  });

  test("returns null for already completed list", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test3@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User 3",
        email: "test3@test.com",
      });
    });

    const txId = await ctx.run(async (c) => {
      return await c.db.insert("transactions", {
        userId: userId as any,
        type: "expense",
        name: "Lista existente",
        amountCents: 1000,
        date: Date.now(),
        status: "paid",
        isCredit: false,
        isRecurring: false,
        includeInStats: true,
        competenceMonth: 4,
        competenceYear: 2026,
        createdAt: Date.now(),
      });
    });

    const listId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingLists", {
        userId: userId as any,
        name: "Lista existente",
        month: 4,
        year: 2026,
        budgetCents: 5000,
        totalCents: 1000,
        status: "completed",
        completedAt: Date.now(),
        transactionId: txId as any,
        createdAt: Date.now(),
      });
    });

    let result: any = null;
    await ctx.run(async (c) => {
      const list = await c.db.get(listId);
      if (list?.status === "completed") {
        result = list.transactionId;
      }
    });

    expect(result).not.toBeNull();
  });
});

describe("shoppingLists.reopen", () => {
  test("deletes transaction when reopening completed list", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test4@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User 4",
        email: "test4@test.com",
      });
    });

    const txId = await ctx.run(async (c) => {
      return await c.db.insert("transactions", {
        userId: userId as any,
        type: "expense",
        name: "Lista para reopen",
        amountCents: 1000,
        date: Date.now(),
        status: "paid",
        isCredit: false,
        isRecurring: false,
        includeInStats: true,
        competenceMonth: 4,
        competenceYear: 2026,
        createdAt: Date.now(),
      });
    });

    const listId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingLists", {
        userId: userId as any,
        name: "Lista para reopen",
        month: 4,
        year: 2026,
        budgetCents: 5000,
        totalCents: 1000,
        status: "completed",
        completedAt: Date.now(),
        transactionId: txId as any,
        createdAt: Date.now(),
      });
    });

    await ctx.run(async (c) => {
      const list = await c.db.get(listId);
      if (!list) return;

      if (list.transactionId) {
        await c.db.delete(list.transactionId);
      }

      await c.db.patch(listId, {
        status: "active",
        completedAt: undefined,
        transactionId: undefined,
      });
    });

    const list = await ctx.run(async (c) => {
      return await c.db.get(listId);
    });

    expect(list?.status).toBe("active");
    expect(list?.completedAt).toBeUndefined();
    expect(list?.transactionId).toBeUndefined();

    const deletedTx = await ctx.run(async (c) => {
      return await c.db.get(txId);
    });

    expect(deletedTx).toBeNull();
  });
});

describe("shoppingItems.togglePurchased", () => {
  test("auto-completes list when last item is purchased", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test5@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User 5",
        email: "test5@test.com",
      });
    });

    const listId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingLists", {
        userId: userId as any,
        name: "Lista com itens",
        month: 4,
        year: 2026,
        budgetCents: 5000,
        totalCents: 1500,
        status: "active",
        createdAt: Date.now(),
      });
    });

    const itemId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingItems", {
        listId: listId as any,
        userId: userId as any,
        name: "Item 1",
        unit: "un",
        quantity: 1,
        unitPriceCents: 1500,
        totalCents: 1500,
        isPurchased: false,
        createdAt: Date.now(),
      });
    });

    await ctx.run(async (c) => {
      const item = await c.db.get(itemId);
      if (!item) return;

      await c.db.patch(itemId, {
        isPurchased: true,
        purchasedAt: Date.now(),
      });

      const list = await c.db.get(item.listId);
      if (!list) return;

      const completedAt = Date.now();
      const txId = await c.db.insert("transactions", {
        userId: list.userId,
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

      await c.db.patch(list._id, {
        status: "completed",
        completedAt,
        transactionId: txId,
      });
    });

    const list = await ctx.run(async (c) => {
      return await c.db.get(listId);
    });

    expect(list?.status).toBe("completed");
    expect(list?.transactionId).not.toBeNull();

    const tx = await ctx.run(async (c) => {
      return await c.db.get(list!.transactionId!);
    });

    expect(tx?.type).toBe("expense");
    expect(tx?.amountCents).toBe(1500);
  });

  test("reopens list when unchecking item from completed list", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test6@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User 6",
        email: "test6@test.com",
      });
    });

    const txId = await ctx.run(async (c) => {
      return await c.db.insert("transactions", {
        userId: userId as any,
        type: "expense",
        name: "Lista para desmarcar",
        amountCents: 1000,
        date: Date.now(),
        status: "paid",
        isCredit: false,
        isRecurring: false,
        includeInStats: true,
        competenceMonth: 4,
        competenceYear: 2026,
        createdAt: Date.now(),
      });
    });

    const listId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingLists", {
        userId: userId as any,
        name: "Lista para desmarcar",
        month: 4,
        year: 2026,
        budgetCents: 5000,
        totalCents: 1000,
        status: "completed",
        completedAt: Date.now(),
        transactionId: txId as any,
        createdAt: Date.now(),
      });
    });

    const itemId = await ctx.run(async (c) => {
      return await c.db.insert("shoppingItems", {
        listId: listId as any,
        userId: userId as any,
        name: "Item 1",
        unit: "un",
        quantity: 1,
        unitPriceCents: 1000,
        totalCents: 1000,
        isPurchased: true,
        purchasedAt: Date.now(),
        createdAt: Date.now(),
      });
    });

    await ctx.run(async (c) => {
      const item = await c.db.get(itemId);
      if (!item) return;

      await c.db.patch(itemId, {
        isPurchased: false,
        purchasedAt: undefined,
      });

      const list = await c.db.get(item.listId);
      if (!list) return;

      if (list.status === "completed") {
        if (list.transactionId) {
          await c.db.delete(list.transactionId);
        }

        await c.db.patch(list._id, {
          status: "active",
          completedAt: undefined,
          transactionId: undefined,
        });
      }
    });

    const list = await ctx.run(async (c) => {
      return await c.db.get(listId);
    });

    expect(list?.status).toBe("active");
    expect(list?.transactionId).toBeUndefined();
  });
});
