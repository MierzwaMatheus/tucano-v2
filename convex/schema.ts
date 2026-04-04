import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  shoppingLists: defineTable({
    userId: v.id("users"),
    name: v.string(),
    month: v.number(),
    year: v.number(),
    budgetCents: v.number(),
    totalCents: v.number(),
    status: v.union(v.literal("active"), v.literal("completed")),
    completedAt: v.optional(v.number()),
    transactionId: v.optional(v.id("transactions")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_month", ["userId", "year", "month"]),

  productCatalog: defineTable({
    userId: v.id("users"),
    name: v.string(),
    defaultUnit: v.string(),
    defaultBrand: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    lastPriceCents: v.number(),
    priceHistory: v.array(
      v.object({
        priceCents: v.number(),
        date: v.number(),
        listId: v.id("shoppingLists"),
      }),
    ),
    nameLower: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "nameLower"]),

  shoppingItems: defineTable({
    listId: v.id("shoppingLists"),
    userId: v.id("users"),
    catalogItemId: v.optional(v.id("productCatalog")),
    name: v.string(),
    unit: v.string(),
    quantity: v.number(),
    unitPriceCents: v.number(),
    totalCents: v.number(),
    brand: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    isPurchased: v.boolean(),
    purchasedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_list", ["listId"])
    .index("by_list_purchased", ["listId", "isPurchased"])
    .index("by_user", ["userId"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("income"), v.literal("expense")),
    name: v.string(),
    description: v.optional(v.string()),
    amountCents: v.number(),
    date: v.number(),
    categoryId: v.optional(v.id("categories")),
    status: v.union(v.literal("pending"), v.literal("paid")),
    isCredit: v.boolean(),
    creditCardId: v.optional(v.id("creditCards")),
    installmentGroupId: v.optional(v.string()),
    installmentNumber: v.optional(v.number()),
    totalInstallments: v.optional(v.number()),
    isRecurring: v.boolean(),
    isSubscription: v.optional(v.boolean()),
    recurringGroupId: v.optional(v.string()),
    includeInStats: v.boolean(),
    competenceMonth: v.number(),
    competenceYear: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_period", ["userId", "competenceYear", "competenceMonth"])
    .index("by_user_type_period", [
      "userId",
      "type",
      "competenceYear",
      "competenceMonth",
    ])
    .index("by_recurring_group", ["recurringGroupId"])
    .index("by_installment_group", ["installmentGroupId"])
    .index("by_card_period", [
      "creditCardId",
      "competenceYear",
      "competenceMonth",
    ]),

  creditCards: defineTable({
    userId: v.id("users"),
    name: v.string(),
    closingDay: v.number(),
    paymentDay: v.number(),
    creditLimitCents: v.optional(v.number()),
    isEnabled: v.boolean(),
    color: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("shopping"),
      v.literal("income"),
      v.literal("expense"),
      v.literal("all"),
    ),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
