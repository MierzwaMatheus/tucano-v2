import { useState, useMemo, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  CreditCard,
  RefreshCw,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Pencil,
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
import { CategorySelect } from "../components/CategorySelect";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { TransactionForm } from "../components/TransactionForm";
import {
  FloatingActionButton,
  ResponsiveModal,
} from "../components/FloatingActionButton";

export function FinancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    id: Id<"transactions">;
    name: string;
    amountCents: number;
    description?: string;
    categoryId?: string;
    status: "pending" | "paid";
    includeInStats: boolean;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id<"transactions">;
    hasGroup: boolean;
  } | null>(null);
  const [deleteMode, setDeleteMode] = useState<"single" | "thisAndFuture">(
    "single",
  );
  const [expandedSections, setExpandedSections] = useState({
    unpaidExpenses: true,
    paidExpenses: false,
    unpaidIncomes: true,
    paidIncomes: false,
  });

  const summary = useQuery(api.transactions.summarize, { month, year });
  const transactions =
    useQuery(api.transactions.listByPeriod, { month, year }) ?? [];
  const categories = useQuery(api.categories.list, {}) ?? [];
  const creditCards = useQuery(api.creditCards.list) ?? [];

  const addTransaction = useMutation(api.transactions.addTransaction);
  const editTransaction = useMutation(api.transactions.editTransaction);
  const toggleStatus = useMutation(api.transactions.toggleStatus);
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);

  const expenses = transactions.filter((t) => t.type === "expense");
  const incomes = transactions.filter((t) => t.type === "income");

  const unpaidExpenses = expenses.filter((t) => t.status === "pending");
  const paidExpenses = expenses.filter((t) => t.status === "paid");
  const unpaidIncomes = incomes.filter((t) => t.status === "pending");
  const paidIncomes = incomes.filter((t) => t.status === "paid");

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

  function toggleSection(section: keyof typeof expandedSections) {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

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

  function handleEditClick(tx: {
    _id: Id<"transactions">;
    name: string;
    amountCents: number;
    description?: string;
    category?: { name: string; color?: string; icon?: string } | null;
    status: "pending" | "paid";
    includeInStats: boolean;
  }) {
    const categoryId = tx.category
      ? (tx.category as unknown as { _id: string })._id
      : undefined;
    setEditTarget({
      id: tx._id,
      name: tx.name,
      amountCents: tx.amountCents,
      description: tx.description,
      categoryId,
      status: tx.status,
      includeInStats: tx.includeInStats,
    });
    setForm((prev) => ({
      ...prev,
      name: tx.name,
      amount: (tx.amountCents / 100).toString(),
      description: tx.description || "",
      categoryId: categoryId || "",
      status: tx.status,
      includeInStats: tx.includeInStats,
    }));
    setShowAdd(true);
  }

  async function handleEditSubmit() {
    if (!editTarget || !form.name.trim() || !form.amount) return;
    try {
      const amountCents = Math.round(
        parseFloat(form.amount.replace(",", ".")) * 100,
      );
      await editTransaction({
        id: editTarget.id,
        name: form.name,
        amountCents,
        description: form.description || undefined,
        categoryId: form.categoryId as Id<"categories"> | undefined,
        status: form.status,
        includeInStats: form.includeInStats,
      });
      setEditTarget(null);
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
    } catch (error) {
      console.error("Erro ao editar transação:", error);
    }
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text-primary">Visão</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="hidden md:flex items-center gap-2 bg-accent text-surface-page px-4 py-2.5 rounded-button font-medium hover:bg-accent-hover transition-colors shadow-card"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <SummaryCard
            label={SUMMARY_LABELS.INCOMES}
            value={summary.totalIncome}
            color="text-status-success"
          />
          <SummaryCard
            label={SUMMARY_LABELS.EXPENSES}
            value={summary.totalExpense}
            color="text-status-error"
          />
          <SummaryCard
            label={SUMMARY_LABELS.BALANCE}
            value={summary.balance}
            color={summary.balance >= 0 ? "text-accent" : "text-status-error"}
          />
          <SummaryCard
            label={SUMMARY_LABELS.PENDING}
            value={summary.pending}
            color="text-status-warning"
          />
        </div>
      )}

      {/* Expenses - Unpaid */}
      {unpaidExpenses.length > 0 && (
        <CollapsibleSection
          title={`${TYPE_LABELS.EXPENSE} - ${STATUS_LABELS.PENDING}`}
          count={unpaidExpenses.length}
          isExpanded={expandedSections.unpaidExpenses}
          onToggle={() => toggleSection("unpaidExpenses")}
        >
          {unpaidExpenses.map((tx) => (
            <TransactionRow
              key={tx._id}
              tx={tx}
              onToggle={() => toggleStatus({ id: tx._id })}
              onDelete={() => handleDeleteClick(tx)}
              onEdit={() => handleEditClick(tx)}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* Expenses - Paid */}
      {paidExpenses.length > 0 && (
        <CollapsibleSection
          title={`${TYPE_LABELS.EXPENSE} - ${STATUS_LABELS.PAID}`}
          count={paidExpenses.length}
          isExpanded={expandedSections.paidExpenses}
          onToggle={() => toggleSection("paidExpenses")}
        >
          {paidExpenses.map((tx) => (
            <TransactionRow
              key={tx._id}
              tx={tx}
              onToggle={() => toggleStatus({ id: tx._id })}
              onDelete={() => handleDeleteClick(tx)}
              onEdit={() => handleEditClick(tx)}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* Incomes - Unpaid */}
      {unpaidIncomes.length > 0 && (
        <CollapsibleSection
          title={`${TYPE_LABELS.INCOME} - ${STATUS_LABELS.PENDING}`}
          count={unpaidIncomes.length}
          isExpanded={expandedSections.unpaidIncomes}
          onToggle={() => toggleSection("unpaidIncomes")}
        >
          {unpaidIncomes.map((tx) => (
            <TransactionRow
              key={tx._id}
              tx={tx}
              onToggle={() => toggleStatus({ id: tx._id })}
              onDelete={() => handleDeleteClick(tx)}
              onEdit={() => handleEditClick(tx)}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* Incomes - Paid */}
      {paidIncomes.length > 0 && (
        <CollapsibleSection
          title={`${TYPE_LABELS.INCOME} - ${STATUS_LABELS.PAID}`}
          count={paidIncomes.length}
          isExpanded={expandedSections.paidIncomes}
          onToggle={() => toggleSection("paidIncomes")}
        >
          {paidIncomes.map((tx) => (
            <TransactionRow
              key={tx._id}
              tx={tx}
              onToggle={() => toggleStatus({ id: tx._id })}
              onDelete={() => handleDeleteClick(tx)}
              onEdit={() => handleEditClick(tx)}
            />
          ))}
        </CollapsibleSection>
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

      <FloatingActionButton
        onClick={() => setShowAdd(true)}
        ariaLabel="Adicionar transação"
      />

      {showAdd && (
        <ResponsiveModal
          title={
            editTarget
              ? MODAL_TITLES.EDIT_TRANSACTION
              : MODAL_TITLES.NEW_TRANSACTION
          }
          onClose={() => {
            setShowAdd(false);
            setEditTarget(null);
          }}
          isOpen={showAdd}
        >
          <TransactionForm
            form={form}
            setForm={setForm}
            availableCategories={availableCategories}
            creditCards={creditCards}
            onSubmit={editTarget ? handleEditSubmit : handleAdd}
            isEditing={!!editTarget}
          />
        </ResponsiveModal>
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
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-4">
      <div className="text-xs text-text-muted mb-0.5">{label}</div>
      <div className={`font-bold text-lg ${color}`}>{formatBRL(value)}</div>
    </div>
  );
}

interface TransactionRowProps {
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
  onEdit: () => void;
}

function TransactionRow({
  tx,
  onToggle,
  onDelete,
  onEdit,
}: TransactionRowProps) {
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
        onClick={onEdit}
        className="flex-shrink-0 p-1.5 text-text-muted hover:text-accent transition-colors mt-0.5"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={onDelete}
        className="flex-shrink-0 p-1.5 text-text-muted hover:text-status-error transition-colors mt-0.5"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function CollapsibleSection({
  title,
  count,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-1 py-2 hover:bg-surface-card/50 rounded-button transition-colors"
      >
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {title} ({count})
        </h3>
        {isExpanded ? (
          <ChevronUp size={16} className="text-text-muted" />
        ) : (
          <ChevronDown size={16} className="text-text-muted" />
        )}
      </button>
      {isExpanded && <div className="space-y-2">{children}</div>}
    </div>
  );
}
