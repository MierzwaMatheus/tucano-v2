/**
 * UI Strings - Debt: This file centralizes user-facing text in Portuguese (PT-BR).
 * The project does NOT currently have i18n implementation.
 *
 * TODO: When i18n is implemented, replace these strings with translation keys:
 * - Install a library like react-i18next or next-intl
 * - Create translation files (e.g., /locales/pt-BR/common.json)
 * - Replace string values with t('key') calls
 *
 * Example migration:
 *   Before: placeholder: "Selecione uma categoria"
 *   After:  placeholder: t('category.select')
 */

export const CATEGORY_SELECT = {
  PLACEHOLDER: "Selecione uma categoria",
  SEARCH_PLACEHOLDER: "Buscar categoria...",
  NO_RESULTS: "Nenhuma categoria encontrada",
  CLEAR_BUTTON: "×",
  NO_CATEGORY: "Sem categoria",
} as const;

export const FORM_LABELS = {
  NAME: "Nome",
  NAME_REQUIRED: "Nome *",
  VALUE: "Valor (R$)",
  VALUE_REQUIRED: "Valor (R$) *",
  DATE: "Data",
  CATEGORY: "Categoria",
  CATEGORY_OPTIONAL: "Categoria (opcional)",
  STATUS: "Status",
  CREDIT_CARD: "Cartão de crédito",
  SELECT_CARD: "Selecionar cartão",
  INSTALLMENTS: "Parcelas",
  RECURRING: "Recorrente mensal (12 meses)",
  INCLUDE_IN_STATS: "Incluir no resumo",
  IS_SUBSCRIPTION: "É assinatura?",
  BRAND: "Marca (opcional)",
  UNIT: "Unidade",
  QUANTITY: "Quantidade",
  UNIT_PRICE: "Preço unitário (R$)",
  UNIT_PRICE_REQUIRED: "Preço unitário (R$) *",
  MONTH: "Mês",
  YEAR: "Ano",
  BUDGET: "Orçamento (R$)",
  DESCRIPTION: "Descrição (opcional)",
  TYPE: "Tipo",
} as const;

export const ACTIONS = {
  ADD: "Adicionar",
  CREATE: "Criar",
  SAVE: "Salvar",
  CANCEL: "Cancelar",
  DELETE: "Excluir",
  EDIT: "Editar",
  CONFIRM: "Confirmar",
  REMOVE: "Remover",
} as const;

export const STATUS_LABELS = {
  PENDING: "Pendente",
  PAID: "Pago",
} as const;

export const TYPE_LABELS = {
  EXPENSE: "Despesa",
  INCOME: "Receita",
  SHOPPING: "Compras",
  ALL: "Geral",
} as const;

export const SHOPPING_LABELS = {
  NEW_LIST: "Nova Lista",
  NEW_LIST_TITLE: "Nova Lista de Compras",
  CREATE_LIST: "Criar Lista",
  ADD_ITEM: "Adicionar Item",
  ADD_ITEM_BUTTON: "Adicionar Item",
  TO_BUY: "A comprar",
  PURCHASED: "Comprados",
  SEARCH_CATALOG: "Buscar no catálogo",
} as const;

export const MODAL_TITLES = {
  NEW_TRANSACTION: "Nova Transação",
  EDIT_TRANSACTION: "Editar Transação",
  DELETE_TRANSACTION: "Excluir transação?",
  ADD_ITEM: "Adicionar Item",
} as const;

export const SUMMARY_LABELS = {
  INCOMES: "Receitas",
  EXPENSES: "Despesas",
  BALANCE: "Saldo",
  PENDING: "A pagar",
} as const;

export const EMPTY_STATES = {
  NO_TRANSACTION: "Nenhuma transação",
  NO_TRANSACTION_HINT: "Adicione receitas e despesas do mês",
  NO_CATEGORY: "Nenhuma categoria",
  NO_CATEGORY_HINT: "Crie categorias para organizar suas finanças",
  NO_LIST: "Nenhuma lista ainda",
  NO_LIST_HINT: "Crie sua primeira lista de compras",
  NO_ITEM: "Nenhum item ainda",
} as const;

export const DASHBOARD_LABELS = {
  TITLE: "Dashboard",
  INCOMES: "Receitas",
  EXPENSES: "Despesas",
  BALANCE: "Saldo",
  AVERAGE_TICKET: "Ticket Médio",
  PER_PURCHASE: "por compra",
  PRICE_EVOLUTION: "Evolução de Preços",
  REPEATED_ITEMS_IMPACT: "Impacto em Itens Repetidos",
  MORE_SPENT: "a mais",
  LESS_SPENT: "a menos",
  NO_REPEATED_ITEMS: "Nenhum item repetido neste mês",
  TOP_INCREASES: "Maiores Altas",
  TOP_DECREASES: "Maiores Baixas",
  NO_INCREASES: "Nenhuma alta registrada",
  NO_DECREASES: "Nenhuma baixa registrada",
  AVG_PRICE_EVOLUTION: "Evolução do Preço Médio",
  SPENDING_BY_CATEGORY: "Gastos por Categoria",
  NO_SPENDING_BY_CATEGORY: "Nenhum gasto por categoria",
  BALANCE_HISTORY: "Evolução do Saldo",
  RECURRING_ITEMS: "Itens Recorrentes",
  NO_RECURRING_ITEMS: "Nenhum item recorrente",
  MONTHS_ABBREV: "meses",
  PER_MONTH: "/mês",
  BOUGHT: "Comprado",
  NOT_BOUGHT: "Não comprado",
} as const;
