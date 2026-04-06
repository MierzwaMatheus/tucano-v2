import { ActionCtx, QueryCtx, MutationCtx } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export interface TransactionAddParams {
  type: "income" | "expense";
  amountCents: number;
  name: string;
  categoryName?: string;
  description?: string;
  isPaid?: boolean;
}

export interface TransactionAddCreditParams {
  type: "income" | "expense";
  amountCents: number;
  name: string;
  cardName: string;
  installments?: number;
  description?: string;
  categoryName?: string;
  competenceMonth?: number;
  competenceYear?: number;
  isPaid?: boolean;
}

export interface TransactionAddRecurringParams {
  type: "income" | "expense";
  amountCents: number;
  name: string;
  isSubscription: boolean;
  description?: string;
  categoryName?: string;
  competenceMonth?: number;
  competenceYear?: number;
  isPaid?: boolean;
}

export interface ShoppingListCreateParams {
  name: string;
  month?: number;
  year?: number;
  budgetCents?: number;
}

export interface ShoppingItemAddParams {
  listName?: string;
  name: string;
  quantity?: number;
  unit?: string;
  unitPriceCents?: number;
}

export interface CardTransactionsQueryParams {
  cardName: string;
  month?: number;
  year?: number;
}

export interface TransactionsQueryParams {
  month?: number;
  year?: number;
  type?: "income" | "expense";
  limit?: number;
}

export async function executeTransactionAdd(
  ctx: {
    runQuery: QueryCtx["runQuery"];
    runMutation: MutationCtx["runMutation"];
  },
  userId: Id<"users">,
  params: TransactionAddParams,
): Promise<string> {
  const categoryId: Id<"categories"> | undefined = params.categoryName
    ? (((await ctx.runQuery(
        internal.telegramHelpers.findCategoryByNameInternal,
        { userId, categoryName: params.categoryName },
      )) as Id<"categories"> | null) ?? undefined)
    : undefined;

  await ctx.runMutation(internal.telegramHelpers.addTransactionInternal, {
    userId,
    type: params.type,
    name: params.name,
    amountCents: params.amountCents,
    date: Date.now(),
    description: params.description,
    categoryId,
    status: params.isPaid ? "paid" : "pending",
  });

  const typeText = params.type === "income" ? "receita" : "despesa";
  const categoryText = categoryId
    ? ` na categoria "${params.categoryName}"`
    : "";
  return `${typeText} de R$ ${(params.amountCents / 100).toFixed(2)}${categoryText} adicionada!`;
}

export async function executeTransactionAddCredit(
  ctx: {
    runQuery: QueryCtx["runQuery"];
    runMutation: MutationCtx["runMutation"];
  },
  userId: Id<"users">,
  params: TransactionAddCreditParams,
): Promise<string> {
  const categoryId: Id<"categories"> | undefined = params.categoryName
    ? (((await ctx.runQuery(
        internal.telegramHelpers.findCategoryByNameInternal,
        { userId, categoryName: params.categoryName },
      )) as Id<"categories"> | null) ?? undefined)
    : undefined;

  const cardId = await ctx.runQuery(
    internal.telegramHelpers.findCreditCardByNameInternal,
    { userId, cardName: params.cardName },
  );

  if (!cardId) {
    return `Cartão "${params.cardName}" não encontrado. Use "meus cartões" para ver os disponíveis.`;
  }

  const compMonth = params.competenceMonth ?? new Date().getMonth() + 1;
  const compYear = params.competenceYear ?? new Date().getFullYear();

  await ctx.runMutation(internal.telegramHelpers.addTransactionFullInternal, {
    userId,
    type: params.type,
    name: params.name,
    amountCents: params.amountCents,
    date: Date.now(),
    description: params.description,
    isCredit: true,
    creditCardId: cardId,
    categoryId,
    installments:
      params.installments && params.installments > 1
        ? params.installments
        : undefined,
    isRecurring: false,
    competenceMonth: compMonth,
    competenceYear: compYear,
    status: params.isPaid ? "paid" : undefined,
  });

  const installmentText =
    params.installments && params.installments > 1
      ? ` em ${params.installments}x`
      : "";
  const typeText = params.type === "income" ? "receita" : "despesa";
  const categoryText = categoryId ? ` em "${params.categoryName}"` : "";
  return `${typeText} de R$ ${(params.amountCents / 100).toFixed(2)}${installmentText}${categoryText} no ${params.cardName} adicionada!`;
}

export async function executeTransactionAddRecurring(
  ctx: {
    runQuery: QueryCtx["runQuery"];
    runMutation: MutationCtx["runMutation"];
  },
  userId: Id<"users">,
  params: TransactionAddRecurringParams,
): Promise<string> {
  const categoryId: Id<"categories"> | undefined = params.categoryName
    ? (((await ctx.runQuery(
        internal.telegramHelpers.findCategoryByNameInternal,
        { userId, categoryName: params.categoryName },
      )) as Id<"categories"> | null) ?? undefined)
    : undefined;

  const compMonth = params.competenceMonth ?? new Date().getMonth() + 1;
  const compYear = params.competenceYear ?? new Date().getFullYear();

  await ctx.runMutation(internal.telegramHelpers.addTransactionFullInternal, {
    userId,
    type: params.type,
    name: params.name,
    amountCents: params.amountCents,
    date: Date.now(),
    description: params.description,
    isCredit: false,
    creditCardId: undefined,
    categoryId,
    isRecurring: true,
    isSubscription: params.isSubscription,
    competenceMonth: compMonth,
    competenceYear: compYear,
    status: params.isPaid ? "paid" : undefined,
  });

  const typeText = params.type === "income" ? "receita" : "despesa";
  const recurringText = params.isSubscription
    ? "assinatura"
    : "transação recorrente";
  return `${typeText} ${recurringText} de R$ ${(params.amountCents / 100).toFixed(2)} registrada!`;
}

export async function executeShoppingListCreate(
  ctx: {
    runQuery: QueryCtx["runQuery"];
    runMutation: MutationCtx["runMutation"];
  },
  userId: Id<"users">,
  params: ShoppingListCreateParams,
): Promise<string> {
  const now = new Date();
  const month = params.month ?? now.getMonth() + 1;
  const year = params.year ?? now.getFullYear();
  const name = params.name ?? `Lista ${month}/${year}`;
  const budgetCents = params.budgetCents ?? 0;

  await ctx.runMutation(internal.telegramHelpers.createShoppingListInternal, {
    userId,
    name,
    month,
    year,
    budgetCents,
  });

  return `Lista "${name}" criada com sucesso!`;
}

export async function executeShoppingItemAdd(
  ctx: {
    runQuery: QueryCtx["runQuery"];
    runMutation: MutationCtx["runMutation"];
  },
  userId: Id<"users">,
  params: ShoppingItemAddParams,
): Promise<string> {
  const listId = await ctx.runQuery(
    internal.telegramHelpers.findActiveShoppingListInternal,
    {
      userId,
      listName: params.listName ?? undefined,
    },
  );

  if (!listId) {
    return "Nenhuma lista de compras ativa encontrada. Crie uma primeiro!";
  }

  await ctx.runMutation(internal.telegramHelpers.addShoppingItemInternal, {
    userId,
    listId,
    name: params.name,
    unit: params.unit ?? "un",
    quantity: params.quantity ?? 1,
    unitPriceCents: params.unitPriceCents ?? 0,
  });

  return `"${params.name}" adicionado à lista!`;
}

export async function executeQueryMonthSummary(
  ctx: { runQuery: QueryCtx["runQuery"] },
  userId: Id<"users">,
): Promise<string> {
  const now = new Date();
  const summary = await ctx.runQuery(
    internal.telegramHelpers.getMonthSummaryInternal,
    {
      userId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
  );

  return (
    `📊 Resumo do mês:\n` +
    `💰 Receitas: R$ ${(summary.totalIncome / 100).toFixed(2)}\n` +
    `💸 Despesas: R$ ${(summary.totalExpense / 100).toFixed(2)}\n` +
    `📈 Saldo: R$ ${(summary.balance / 100).toFixed(2)}\n` +
    `⏳ Pendente: R$ ${(summary.pending / 100).toFixed(2)}`
  );
}

export async function executeQueryActiveLists(
  ctx: { runQuery: QueryCtx["runQuery"] },
  userId: Id<"users">,
): Promise<string> {
  const lists = await ctx.runQuery(
    internal.telegramHelpers.getUserActiveListsInternal,
    { userId },
  );

  if (lists.length === 0) {
    return "Nenhuma lista de compras ativa.";
  }

  return (
    "📝 Listas ativas:\n" +
    lists
      .map(
        (l: Doc<"shoppingLists">) =>
          `• ${l.name} - R$ ${(l.totalCents / 100).toFixed(2)} (${l.month}/${l.year})`,
      )
      .join("\n")
  );
}

export async function executeQueryCreditCards(
  ctx: { runQuery: QueryCtx["runQuery"] },
  userId: Id<"users">,
): Promise<string> {
  const cards = await ctx.runQuery(
    internal.telegramHelpers.getCreditCardsInternal,
    { userId },
  );

  if (cards.length === 0) {
    return "Nenhum cartão cadastrado.";
  }

  return (
    "💳 Meus cartões:\n" +
    cards
      .map(
        (c) =>
          `• ${c.name} (Fechamento: ${c.closingDay}, Vencimento: ${c.paymentDay})`,
      )
      .join("\n")
  );
}

export async function executeQueryCategories(
  ctx: { runQuery: QueryCtx["runQuery"] },
  userId: Id<"users">,
): Promise<string> {
  const cats = await ctx.runQuery(
    internal.telegramHelpers.getCategoriesInternal,
    { userId },
  );

  if (cats.length === 0) {
    return "Nenhuma categoria cadastrada.";
  }

  return `🏷️ Minhas categorias:\n${cats.map((c) => `• ${c.name}`).join("\n")}`;
}

export async function executeQueryTransactions(
  ctx: { runQuery: QueryCtx["runQuery"] },
  userId: Id<"users">,
  params: TransactionsQueryParams,
): Promise<string> {
  const txs = await ctx.runQuery(
    internal.telegramHelpers.getTransactionsInternal,
    {
      userId,
      month: params.month,
      year: params.year,
      type: params.type,
      limit: params.limit ?? 20,
    },
  );

  if (txs.length === 0) {
    return "Nenhuma transação encontrada.";
  }

  return (
    "💰 Minhas transações:\n" +
    txs
      .map((t) => {
        const icon = t.type === "income" ? "💚" : "🔴";
        const amount = (t.amountCents / 100).toFixed(2);
        const cardInfo = t.creditCardId
          ? ` (${t.installmentNumber || ""}${t.totalInstallments ? `/${t.totalInstallments}` : ""})`
          : "";
        return `${icon} R$ ${amount} - ${t.name}${cardInfo}`;
      })
      .join("\n")
  );
}

export async function executeQueryCardTransactions(
  ctx: { runQuery: QueryCtx["runQuery"] },
  userId: Id<"users">,
  params: CardTransactionsQueryParams,
): Promise<string> {
  const cardId = await ctx.runQuery(
    internal.telegramHelpers.findCreditCardByNameInternal,
    { userId, cardName: params.cardName },
  );

  if (!cardId) {
    return `Cartão "${params.cardName}" não encontrado.`;
  }

  const month = params.month ?? new Date().getMonth() + 1;
  const year = params.year ?? new Date().getFullYear();

  const txs = await ctx.runQuery(
    internal.telegramHelpers.getTransactionsByCardInternal,
    { userId, cardId, month, year },
  );

  if (txs.length === 0) {
    return `Nenhuma transação no ${params.cardName} em ${month}/${year}.`;
  }

  const total = txs.reduce((sum, t) => sum + t.amountCents, 0);
  return (
    `💳 ${params.cardName} - ${month}/${year}:\n` +
    txs
      .map((t) => `• R$ ${(t.amountCents / 100).toFixed(2)} - ${t.name}`)
      .join("\n") +
    `\n💵 Total: R$ ${(total / 100).toFixed(2)}`
  );
}

export async function executeQueryShoppingListItems(
  ctx: { runQuery: QueryCtx["runQuery"] },
  userId: Id<"users">,
  listName?: string,
): Promise<string> {
  const listId = await ctx.runQuery(
    internal.telegramHelpers.findActiveShoppingListInternal,
    { userId, listName },
  );

  if (!listId) {
    return "Lista não encontrada.";
  }

  const items = await ctx.runQuery(
    internal.telegramHelpers.getShoppingListItemsInternal,
    { listId },
  );

  if (items.length === 0) {
    return "Lista vazia.";
  }

  return (
    "🛒 Itens da lista:\n" +
    items
      .map(
        (i) =>
          `${i.isPurchased ? "✅" : "⬜"} ${i.quantity} ${i.unit} ${i.name} - R$ ${(i.totalCents / 100).toFixed(2)}`,
      )
      .join("\n")
  );
}

export async function executeQueryAllLists(
  ctx: { runQuery: QueryCtx["runQuery"] },
  userId: Id<"users">,
): Promise<string> {
  const lists = await ctx.runQuery(
    internal.telegramHelpers.getAllShoppingListsInternal,
    { userId },
  );

  if (lists.length === 0) {
    return "Nenhuma lista de compras.";
  }

  return (
    "📝 Todas as listas:\n" +
    lists
      .map(
        (l) =>
          `• ${l.name} - ${l.status === "completed" ? "✅" : "🟡"} R$ ${(l.totalCents / 100).toFixed(2)} (${l.month}/${l.year})`,
      )
      .join("\n")
  );
}
