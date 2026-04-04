import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  CreditCard,
  RefreshCw,
  Layers,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatBRL, toCents, fromCents } from "../lib/currency";
import {
  CATEGORY_SELECT,
  FORM_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  ACTIONS,
  EMPTY_STATES,
  SUMMARY_LABELS,
  MODAL_TITLES,
} from "../lib/ui-strings";
import { MONTHS } from "../lib/dates";
import { MonthNavigator } from "../components/MonthNavigator";
import { Modal } from "../components/Modal";
import { CategorySelect } from "../components/CategorySelect";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { TransactionForm } from "../components/TransactionForm";

export function FinancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id<"transactions">;
    hasGroup: boolean;
  } | null>(null);
  const [deleteMode, setDeleteMode] = useState<"single" | "thisAndFuture">(
    "single",
  );

  const summary = useQuery(api.transactions.summarize, { month, year });
  const transactions =
    useQuery(api.transactions.listByPeriod, { month, year }) ?? [];
  const categories = useQuery(api.categories.list, {}) ?? [];
  const creditCards = useQuery(api.creditCards.list) ?? [];

  const addTransaction = useMutation(api.transactions.addTransaction);
  const toggleStatus = useMutation(api.transactions.toggleStatus);
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);

  const incomes = transactions.filter((t) => t.type === "income");
  const expenses = transactions.filter((t) => t.type === "expense");

  const [form, setForm] = useState({
    type: "expense" as "income" | "expense",
    name: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "" as string,
    status: "pending" as "pending" | "paid",
    isCredit: false,
    creditCardId: "" as string,
    isRecurring: false,
    isSubscription: false,
    installments: "1",
    includeInStats: true,
    description: "",
  });

  const availableCategories = useMemo(
    () => categories.filter((c) => c.type === form.type || c.type === "all"),
    [categories, form.type],
  );

  async function handleAdd() {
    if (!form.name.trim() || !form.amount) return;
    await addTransaction({
      type: form.type,
      name: form.name.trim(),
      amountCents: toCents(parseFloat(form.amount) || 0),
      date: new Date(form.date + "T12:00:00").getTime(),
      categoryId: form.categoryId
        ? (form.categoryId as Id<"categories">)
        : undefined,
      status: form.status,
      isCredit: form.isCredit,
      creditCardId:
        form.isCredit && form.creditCardId
          ? (form.creditCardId as Id<"creditCards">)
          : undefined,
      isRecurring: form.isRecurring,
      isSubscription: form.isSubscription,
      installments: parseInt(form.installments) || 1,
      includeInStats: form.includeInStats,
      description: form.description || undefined,
    });
    setShowAdd(false);
    setForm({
      type: "expense",
      name: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      categoryId: "",
      status: "pending",
      isCredit: false,
      creditCardId: "",
      isRecurring: false,
      isSubscription: false,
      installments: "1",
      includeInStats: true,
      description: "",
    });
  }

  function handleDeleteClick(tx: {
    _id: Id<"transactions">;
    recurringGroupId?: string;
    installmentGroupId?: string;
  }) {
    const hasGroup = !!(tx.recurringGroupId || tx.installmentGroupId);
    setDeleteTarget({ id: tx._id, hasGroup });
    setDeleteMode("single");
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text-primary">Visão</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-accent text-surface-page px-4 py-2.5 rounded-button font-medium hover:bg-accent-hover transition-colors shadow-card"
        >
          <Plus size={18} />
          {ACTIONS.ADD}
        </button>
      </div>

      <div className="flex justify-center mb-5">
        <MonthNavigator
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <SummaryCard
            label={SUMMARY_LABELS.INCOMES}
            value={summary.totalIncome}
            icon={<TrendingUp size={18} />}
            color="text-status-success"
            bg="bg-accent-subtle"
          />
          <SummaryCard
            label={SUMMARY_LABELS.EXPENSES}
            value={summary.totalExpense}
            icon={<TrendingDown size={18} />}
            color="text-status-error"
            bg="bg-status-error/10"
          />
          <SummaryCard
            label={SUMMARY_LABELS.BALANCE}
            value={summary.balance}
            icon={<Wallet size={18} />}
            color={summary.balance >= 0 ? "text-accent" : "text-status-error"}
            bg="bg-accent-subtle"
          />
          <SummaryCard
            label={SUMMARY_LABELS.PENDING}
            value={summary.pending}
            icon={<Clock size={18} />}
            color="text-status-warning"
            bg="bg-status-warning/10"
          />
        </div>
      )}

      {/* Incomes */}
      {incomes.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            {TYPE_LABELS.INCOME} ({incomes.length})
          </h3>
          <div className="space-y-2">
            {incomes.map((tx) => (
              <TransactionRow
                key={tx._id}
                tx={tx}
                onToggle={() => toggleStatus({ id: tx._id })}
                onDelete={() => handleDeleteClick(tx)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expenses */}
      {expenses.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            {TYPE_LABELS.EXPENSE} ({expenses.length})
          </h3>
          <div className="space-y-2">
            {expenses.map((tx) => (
              <TransactionRow
                key={tx._id}
                tx={tx}
                onToggle={() => toggleStatus({ id: tx._id })}
                onDelete={() => handleDeleteClick(tx)}
              />
            ))}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="text-center py-16">
          <svg
            className="mx-auto mb-4"
            width="80"
            height="40"
            viewBox="0 0 80 40"
          >
            <line
              x1="0"
              y1="20"
              x2="80"
              y2="20"
              stroke="#6B7078"
              strokeWidth="1"
            />
            <circle cx="20" cy="20" r="2" fill="#6B7078" />
            <circle cx="40" cy="20" r="2" fill="#6B7078" />
            <circle cx="60" cy="20" r="2" fill="#6B7078" />
          </svg>
          <p className="text-text-secondary font-medium">
            {EMPTY_STATES.NO_TRANSACTION}
          </p>
          <p className="text-text-muted text-sm mt-1">
            {EMPTY_STATES.NO_TRANSACTION_HINT}
          </p>
        </div>
      )}

      {showAdd && (
        <Modal
          title={MODAL_TITLES.NEW_TRANSACTION}
          onClose={() => setShowAdd(false)}
        >
          <TransactionForm
            form={form}
            setForm={setForm}
            availableCategories={availableCategories}
            creditCards={creditCards}
            onSubmit={handleAdd}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={MODAL_TITLES.DELETE_TRANSACTION}
          message={
            deleteTarget.hasGroup
              ? "Esta transação faz parte de um grupo. Deseja excluir só esta ou esta e as futuras?"
              : "Esta ação não pode ser desfeita."
          }
          confirmLabel={
            deleteTarget.hasGroup
              ? deleteMode === "single"
                ? "Só esta"
                : "Esta e futuras"
              : "Excluir"
          }
          danger
          onConfirm={async () => {
            await deleteTransaction({ id: deleteTarget.id, mode: deleteMode });
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        >
          {deleteTarget.hasGroup && (
            <div className="flex gap-2 mb-4">
              {(["single", "thisAndFuture"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setDeleteMode(m)}
                  className={`flex-1 py-2 text-sm rounded-button border transition-colors ${
                    deleteMode === m
                      ? "border-status-error bg-status-error/10 text-status-error"
                      : "border-border text-text-muted"
                  }`}
                >
                  {m === "single" ? "Só esta" : "Esta e futuras"}
                </button>
              ))}
            </div>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-4">
      <div className={`inline-flex p-2 rounded-button ${bg} ${color} mb-2`}>
        {icon}
      </div>
      <div className="text-xs text-text-muted mb-0.5">{label}</div>
      <div className={`font-bold text-lg ${color}`}>{formatBRL(value)}</div>
    </div>
  );
}

function TransactionRow({
  tx,
  onToggle,
  onDelete,
}: {
  tx: {
    _id: Id<"transactions">;
    name: string;
    description?: string;
    amountCents: number;
    type: "income" | "expense";
    status: "pending" | "paid";
    isCredit: boolean;
    isRecurring: boolean;
    isSubscription?: boolean;
    installmentNumber?: number;
    totalInstallments?: number;
    recurringGroupId?: string;
    installmentGroupId?: string;
    category?: { name: string; color?: string; icon?: string } | null;
    creditCard?: { name: string } | null;
  };
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isIncome = tx.type === "income";
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const hasDescription = tx.description && tx.description.trim().length > 0;
  const isLongDescription = hasDescription && tx.description!.length > 60;

  return (
    <div className="bg-surface-card rounded-card border border-border-subtle shadow-card flex items-start gap-3 px-4 py-3">
      <button onClick={onToggle} className="flex-shrink-0 mt-0.5">
        {tx.status === "paid" ? (
          <CheckCircle2
            size={20}
            className={isIncome ? "text-accent" : "text-accent"}
          />
        ) : (
          <Circle size={20} className="text-text-muted" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text-primary truncate text-sm">
          {tx.name}
          {tx.installmentNumber && tx.totalInstallments && (
            <span className="text-text-muted font-normal">
              {" "}
              ({tx.installmentNumber}/{tx.totalInstallments})
            </span>
          )}
          {tx.isRecurring && (
            <RefreshCw size={11} className="inline ml-1 text-text-muted" />
          )}
        </div>
        {hasDescription && (
          <div className="text-xs text-text-muted mt-0.5 flex items-start gap-1">
            <span className={isDescriptionExpanded ? "" : "line-clamp-2"}>
              {tx.description}
            </span>
            {isLongDescription && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="flex-shrink-0 text-text-muted hover:text-text-secondary transition-colors"
              >
                {isDescriptionExpanded ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          {tx.category && (
            <span className="text-xs text-text-muted flex items-center gap-1">
              {tx.category.icon && <span>{tx.category.icon}</span>}
              {tx.category.color && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tx.category.color }}
                />
              )}
              <span>{tx.category.name}</span>
            </span>
          )}
          {tx.creditCard && (
            <span className="text-xs text-text-muted flex items-center gap-0.5">
              <CreditCard size={10} /> {tx.creditCard.name}
            </span>
          )}
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              tx.status === "paid"
                ? "bg-accent-subtle text-accent"
                : "bg-status-warning/10 text-status-warning"
            }`}
          >
            {tx.status === "paid" ? "Pago" : "Pendente"}
          </span>
          {tx.isSubscription && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-surface-elevated text-text-muted flex items-center gap-0.5">
              <BadgeCheck size={10} /> Assinatura
            </span>
          )}
        </div>
      </div>
      <div
        className={`font-bold text-sm flex-shrink-0 mt-0.5 ${isIncome ? "text-accent" : "text-text-primary"}`}
      >
        {isIncome ? "+" : "-"}
        {formatBRL(tx.amountCents)}
      </div>
      <button
        onClick={onDelete}
        className="flex-shrink-0 p-1.5 text-text-muted hover:text-status-error transition-colors mt-0.5"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
