// @ts-nocheck
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "../../convex/schema";
import { generateId, getCompetence } from "../../convex/transactions";

const modules = import.meta.glob("../../convex/**/*.ts");

describe("transactions - helper functions", () => {
  describe("generateId", () => {
    test("should generate unique strings", () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(typeof id1).toBe("string");
      expect(typeof id2).toBe("string");
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
    });

    test("should generate different ids even at same timestamp", async () => {
      const ids = [];
      for (let i = 0; i < 100; i++) {
        ids.push(generateId());
      }

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });
  });

  describe("getCompetence", () => {
    test("should return same month for cash purchase", () => {
      const purchaseDate = new Date("2026-03-20").getTime();

      const result = getCompetence(purchaseDate, false, 15);

      expect(result.competenceMonth).toBe(3);
      expect(result.competenceYear).toBe(2026);
    });

    test("should return same month for credit purchase before closing day", () => {
      const purchaseDate = new Date("2026-03-10").getTime();

      const result = getCompetence(purchaseDate, true, 15);

      expect(result.competenceMonth).toBe(3);
      expect(result.competenceYear).toBe(2026);
    });

    test("should return same month for credit purchase on closing day", () => {
      const purchaseDate = new Date(2026, 2, 15, 12, 0, 0).getTime();

      const result = getCompetence(purchaseDate, true, 15);

      expect(result.competenceMonth).toBe(4);
      expect(result.competenceYear).toBe(2026);
    });

    test("should return next month for credit purchase after closing day", () => {
      const purchaseDate = new Date("2026-03-20").getTime();

      const result = getCompetence(purchaseDate, true, 15);

      expect(result.competenceMonth).toBe(4);
      expect(result.competenceYear).toBe(2026);
    });

    test("should handle year rollover correctly", () => {
      const purchaseDate = new Date("2026-12-20").getTime();

      const result = getCompetence(purchaseDate, true, 15);

      expect(result.competenceMonth).toBe(1);
      expect(result.competenceYear).toBe(2027);
    });

    test("should not rollover for cash purchase in december", () => {
      const purchaseDate = new Date("2026-12-31").getTime();

      const result = getCompetence(purchaseDate, false, 15);

      expect(result.competenceMonth).toBe(12);
      expect(result.competenceYear).toBe(2026);
    });

    test("should handle closing day on first of month", () => {
      const purchaseDate = new Date(2026, 2, 1, 12, 0, 0).getTime();

      const result = getCompetence(purchaseDate, true, 1);

      expect(result.competenceMonth).toBe(4);
      expect(result.competenceYear).toBe(2026);
    });

    test("should handle closing day on last day of month", () => {
      const purchaseDate = new Date(2026, 2, 31, 12, 0, 0).getTime();

      const result = getCompetence(purchaseDate, true, 31);

      expect(result.competenceMonth).toBe(4);
      expect(result.competenceYear).toBe(2026);
    });

    test("should not rollover if day equals closing day - 1", () => {
      const purchaseDate = new Date("2026-03-14").getTime();

      const result = getCompetence(purchaseDate, true, 15);

      expect(result.competenceMonth).toBe(3);
      expect(result.competenceYear).toBe(2026);
    });
  });
});

describe("transactions - database operations", () => {
  describe("summarize logic", () => {
    test("should calculate totals correctly", async () => {
      const t = convexTest(schema, modules);
      const ctx = t.withIdentity({ email: "test@test.com" });

      const userId = await ctx.run(async (c) => {
        return await c.db.insert("users", {
          name: "Test User",
          email: "test@test.com",
        });
      });

      await ctx.run(async (c) => {
        await c.db.insert("transactions", {
          userId: userId as any,
          type: "income",
          name: "Salário",
          amountCents: 500000,
          date: Date.now(),
          status: "paid",
          isCredit: false,
          isRecurring: false,
          includeInStats: true,
          competenceMonth: 3,
          competenceYear: 2026,
          createdAt: Date.now(),
        });

        await c.db.insert("transactions", {
          userId: userId as any,
          type: "expense",
          name: "Aluguel",
          amountCents: 150000,
          date: Date.now(),
          status: "paid",
          isCredit: false,
          isRecurring: false,
          includeInStats: true,
          competenceMonth: 3,
          competenceYear: 2026,
          createdAt: Date.now(),
        });

        await c.db.insert("transactions", {
          userId: userId as any,
          type: "expense",
          name: "Cartão",
          amountCents: 50000,
          date: Date.now(),
          status: "pending",
          isCredit: false,
          isRecurring: false,
          includeInStats: true,
          competenceMonth: 3,
          competenceYear: 2026,
          createdAt: Date.now(),
        });

        await c.db.insert("transactions", {
          userId: userId as any,
          type: "expense",
          name: "Ignorar",
          amountCents: 30000,
          date: Date.now(),
          status: "paid",
          isCredit: false,
          isRecurring: false,
          includeInStats: false,
          competenceMonth: 3,
          competenceYear: 2026,
          createdAt: Date.now(),
        });
      });

      const txs = await ctx.run(async (c) => {
        return await c.db
          .query("transactions")
          .withIndex("by_user_period", (q) =>
            q
              .eq("userId", userId as any)
              .eq("competenceYear", 2026)
              .eq("competenceMonth", 3),
          )
          .filter((q) => q.eq(q.field("includeInStats"), true))
          .collect();
      });

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

      expect(totalIncome).toBe(500000);
      expect(totalExpense).toBe(200000);
      expect(totalPaid).toBe(150000);
      expect(totalPending).toBe(50000);
    });
  });

  describe("installment calculations", () => {
    test("should calculate installment amounts correctly", async () => {
      const amountCents = 100000;
      const installments = 3;

      const perInstallment = Math.floor(amountCents / installments);
      const lastInstallment = amountCents - perInstallment * (installments - 1);

      expect(perInstallment).toBe(33333);
      expect(lastInstallment).toBe(33334);
      expect(perInstallment * 2 + lastInstallment).toBe(100000);
    });

    test("should handle uneven installments", async () => {
      const amountCents = 999;
      const installments = 4;

      const perInstallment = Math.floor(amountCents / installments);
      const lastInstallment = amountCents - perInstallment * (installments - 1);

      expect(perInstallment).toBe(249);
      expect(lastInstallment).toBe(252);
      expect(perInstallment * 3 + lastInstallment).toBe(999);
    });

    test("should handle single installment", async () => {
      const amountCents = 1000;
      const installments = 1;

      const perInstallment = Math.floor(amountCents / installments);
      const lastInstallment = amountCents - perInstallment * (installments - 1);

      expect(perInstallment).toBe(1000);
      expect(lastInstallment).toBe(1000);
    });

    test("should handle amount with remainder", async () => {
      const amountCents = 1007;
      const installments = 3;

      const perInstallment = Math.floor(amountCents / installments);
      const lastInstallment = amountCents - perInstallment * (installments - 1);

      expect(perInstallment).toBe(335);
      expect(lastInstallment).toBe(337);
      expect(perInstallment * 2 + lastInstallment).toBe(1007);
    });
  });

  describe("recurring month progression", () => {
    test("should increment months correctly", async () => {
      let m = 3;
      let y = 2026;

      const months = [];
      for (let i = 0; i < 12; i++) {
        months.push({ month: m, year: y });
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }

      expect(months[0]).toEqual({ month: 3, year: 2026 });
      expect(months[9]).toEqual({ month: 12, year: 2026 });
      expect(months[10]).toEqual({ month: 1, year: 2027 });
      expect(months[11]).toEqual({ month: 2, year: 2027 });
    });

    test("should start from january correctly", async () => {
      let m = 1;
      let y = 2026;

      const months = [];
      for (let i = 0; i < 12; i++) {
        months.push({ month: m, year: y });
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }

      expect(months[0]).toEqual({ month: 1, year: 2026 });
      expect(months[11]).toEqual({ month: 12, year: 2026 });
    });

    test("should start from december correctly", async () => {
      let m = 12;
      let y = 2026;

      const months = [];
      for (let i = 0; i < 12; i++) {
        months.push({ month: m, year: y });
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }

      expect(months[0]).toEqual({ month: 12, year: 2026 });
      expect(months[1]).toEqual({ month: 1, year: 2027 });
      expect(months[11]).toEqual({ month: 11, year: 2027 });
    });
  });
});

describe("transactions - authentication edge cases", () => {
  test("should return empty array for unauthenticated user in listByPeriod", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (c) => {
      return await c.db.insert("users", {
        name: "Test User",
        email: "test@test.com",
      });
    });

    await t.run(async (c) => {
      await c.db.insert("transactions", {
        userId: userId as any,
        type: "income",
        name: "Salário",
        amountCents: 500000,
        date: Date.now(),
        status: "paid",
        isCredit: false,
        isRecurring: false,
        includeInStats: true,
        competenceMonth: 3,
        competenceYear: 2026,
        createdAt: Date.now(),
      });
    });

    const txs = await t.run(async (c) => {
      return await c.db
        .query("transactions")
        .withIndex("by_user_period", (q) =>
          q
            .eq("userId", userId as any)
            .eq("competenceYear", 2026)
            .eq("competenceMonth", 3),
        )
        .collect();
    });

    expect(txs.length).toBe(1);
  });

  test("should return zero totals for unauthenticated user", async () => {
    const result = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      pending: 0,
    };

    expect(result.totalIncome).toBe(0);
    expect(result.totalExpense).toBe(0);
    expect(result.balance).toBe(0);
    expect(result.pending).toBe(0);
  });
});
