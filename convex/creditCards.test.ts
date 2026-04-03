/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("creditCards - creation", () => {
  test("should create credit card with all fields", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const cardId = await ctx.run(async (c) => {
      return await c.db.insert("creditCards", {
        userId: userId as any,
        name: "Nubank",
        closingDay: 15,
        paymentDay: 20,
        color: "#8B5CF6",
        isEnabled: true,
        createdAt: Date.now(),
      });
    });

    const card = await ctx.run(async (c) => {
      return await c.db.get(cardId as any);
    });

    expect(card?.name).toBe("Nubank");
    expect(card?.closingDay).toBe(15);
    expect(card?.paymentDay).toBe(20);
    expect(card?.color).toBe("#8B5CF6");
    expect(card?.isEnabled).toBe(true);
  });

  test("should create credit card with minimal fields", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const cardId = await ctx.run(async (c) => {
      return await c.db.insert("creditCards", {
        userId: userId as any,
        name: "Itaú",
        closingDay: 10,
        paymentDay: 15,
        isEnabled: true,
        createdAt: Date.now(),
      });
    });

    const card = await ctx.run(async (c) => {
      return await c.db.get(cardId as any);
    });

    expect(card?.name).toBe("Itaú");
    expect(card?.closingDay).toBe(10);
    expect(card?.paymentDay).toBe(15);
    expect(card?.color).toBeUndefined();
  });

  test("should disable credit card", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const cardId = await ctx.run(async (c) => {
      return await c.db.insert("creditCards", {
        userId: userId as any,
        name: "Bradesco",
        closingDay: 5,
        paymentDay: 10,
        isEnabled: true,
        createdAt: Date.now(),
      });
    });

    await ctx.run(async (c) => {
      await c.db.patch(cardId as any, { isEnabled: false });
    });

    const card = await ctx.run(async (c) => {
      return await c.db.get(cardId as any);
    });

    expect(card?.isEnabled).toBe(false);
  });
});

describe("creditCards - fatura operations", () => {
  test("should list transactions for card period", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const cardId = await ctx.run(async (c) => {
      return await c.db.insert("creditCards", {
        userId: userId as any,
        name: "Nubank",
        closingDay: 15,
        paymentDay: 20,
        isEnabled: true,
        createdAt: Date.now(),
      });
    });

    await ctx.run(async (c) => {
      await c.db.insert("transactions", {
        userId: userId as any,
        type: "expense",
        name: "Compra 1",
        amountCents: 5000,
        date: Date.now(),
        status: "pending",
        isCredit: true,
        creditCardId: cardId as any,
        isRecurring: false,
        includeInStats: true,
        competenceMonth: 3,
        competenceYear: 2026,
        createdAt: Date.now(),
      });

      await c.db.insert("transactions", {
        userId: userId as any,
        type: "expense",
        name: "Compra 2",
        amountCents: 3000,
        date: Date.now(),
        status: "pending",
        isCredit: true,
        creditCardId: cardId as any,
        isRecurring: false,
        includeInStats: true,
        competenceMonth: 3,
        competenceYear: 2026,
        createdAt: Date.now(),
      });

      await c.db.insert("transactions", {
        userId: userId as any,
        type: "expense",
        name: "Outro mês",
        amountCents: 2000,
        date: Date.now(),
        status: "pending",
        isCredit: true,
        creditCardId: cardId as any,
        isRecurring: false,
        includeInStats: true,
        competenceMonth: 4,
        competenceYear: 2026,
        createdAt: Date.now(),
      });
    });

    const fatura = await ctx.run(async (c) => {
      return await c.db
        .query("transactions")
        .withIndex("by_card_period", (q) =>
          q
            .eq("creditCardId", cardId as any)
            .eq("competenceYear", 2026)
            .eq("competenceMonth", 3),
        )
        .collect();
    });

    expect(fatura.length).toBe(2);
    expect(fatura[0].name).toBe("Compra 1");
    expect(fatura[1].name).toBe("Compra 2");
  });

  test("should mark all pending transactions as paid", async () => {
    const t = convexTest(schema, modules);
    const ctx = t.withIdentity({ email: "test@test.com" });

    const userId = await ctx.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    const cardId = await ctx.run(async (c) => {
      return await c.db.insert("creditCards", {
        userId: userId as any,
        name: "Nubank",
        closingDay: 15,
        paymentDay: 20,
        isEnabled: true,
        createdAt: Date.now(),
      });
    });

    const txIds = await ctx.run(async (c) => {
      const tx1 = await c.db.insert("transactions", {
        userId: userId as any,
        type: "expense",
        name: "Compra 1",
        amountCents: 5000,
        date: Date.now(),
        status: "pending",
        isCredit: true,
        creditCardId: cardId as any,
        isRecurring: false,
        includeInStats: true,
        competenceMonth: 3,
        competenceYear: 2026,
        createdAt: Date.now(),
      });

      const tx2 = await c.db.insert("transactions", {
        userId: userId as any,
        type: "expense",
        name: "Compra 2",
        amountCents: 3000,
        date: Date.now(),
        status: "paid",
        isCredit: true,
        creditCardId: cardId as any,
        isRecurring: false,
        includeInStats: true,
        competenceMonth: 3,
        competenceYear: 2026,
        createdAt: Date.now(),
      });

      return [tx1, tx2];
    });

    await ctx.run(async (c) => {
      const items = await c.db
        .query("transactions")
        .withIndex("by_card_period", (q) =>
          q
            .eq("creditCardId", cardId as any)
            .eq("competenceYear", 2026)
            .eq("competenceMonth", 3),
        )
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();

      await Promise.all(
        items.map((t) => c.db.patch(t._id, { status: "paid" })),
      );
    });

    const fatura = await ctx.run(async (c) => {
      return await c.db
        .query("transactions")
        .withIndex("by_card_period", (q) =>
          q
            .eq("creditCardId", cardId as any)
            .eq("competenceYear", 2026)
            .eq("competenceMonth", 3),
        )
        .collect();
    });

    expect(fatura.every((t) => t.status === "paid")).toBe(true);
  });
});

describe("creditCards - validation", () => {
  test("should accept closing day from 1 to 31", async () => {
    const closingDays = [1, 15, 28, 31];

    for (const day of closingDays) {
      const t = convexTest(schema, modules);
      const ctx = t.withIdentity({ email: `test${day}@test.com` });

      const userId = await ctx.run(async (c) => {
        return await c.db.insert("users", {
          name: "Test User",
          email: `test${day}@test.com`,
        });
      });

      const cardId = await ctx.run(async (c) => {
        return await c.db.insert("creditCards", {
          userId: userId as any,
          name: `Card ${day}`,
          closingDay: day,
          paymentDay: 20,
          isEnabled: true,
          createdAt: Date.now(),
        });
      });

      const card = await ctx.run(async (c) => {
        return await c.db.get(cardId as any);
      });

      expect(card?.closingDay).toBe(day);
    }
  });

  test("should accept payment day from 1 to 31", async () => {
    const paymentDays = [1, 15, 28, 31];

    for (const day of paymentDays) {
      const t = convexTest(schema, modules);
      const ctx = t.withIdentity({ email: `test${day}@test.com` });

      const userId = await ctx.run(async (c) => {
        return await c.db.insert("users", {
          name: "Test User",
          email: `test${day}@test.com`,
        });
      });

      const cardId = await ctx.run(async (c) => {
        return await c.db.insert("creditCards", {
          userId: userId as any,
          name: `Card ${day}`,
          closingDay: 10,
          paymentDay: day,
          isEnabled: true,
          createdAt: Date.now(),
        });
      });

      const card = await ctx.run(async (c) => {
        return await c.db.get(cardId as any);
      });

      expect(card?.paymentDay).toBe(day);
    }
  });
});
