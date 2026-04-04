import React from "react";
import { CreditCard, RefreshCw, BadgeCheck, Layers } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { Toggle } from "./Toggle";
import { CategorySelect } from "./CategorySelect";
import {
  CATEGORY_SELECT,
  FORM_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  ACTIONS,
} from "../lib/ui-strings";

interface FormState {
  type: "income" | "expense";
  name: string;
  amount: string;
  date: string;
  categoryId: string;
  status: "pending" | "paid";
  isCredit: boolean;
  creditCardId: string;
  isRecurring: boolean;
  isSubscription: boolean;
  installments: string;
  includeInStats: boolean;
  description: string;
}

interface TransactionFormProps {
  form: FormState;
  setForm: (form: FormState) => void;
  availableCategories: Array<{
    _id: Id<"categories">;
    name: string;
    icon?: string;
    color?: string;
  }>;
  creditCards: Array<{ _id: Id<"creditCards">; name: string }>;
  onSubmit: () => void;
}

export const TransactionForm = React.memo(function TransactionForm({
  form,
  setForm,
  availableCategories,
  creditCards,
  onSubmit,
}: TransactionFormProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div
        className="flex rounded-button overflow-hidden border border-border"
        role="group"
        aria-label="Tipo de transação"
      >
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              form.type === t
                ? t === "expense"
                  ? "bg-status-error text-white"
                  : "bg-status-success text-surface-page"
                : "text-text-muted hover:bg-surface-elevated"
            }`}
            onClick={() => setForm({ ...form, type: t })}
            aria-pressed={form.type === t}
          >
            {t === "expense" ? TYPE_LABELS.EXPENSE : TYPE_LABELS.INCOME}
          </button>
        ))}
      </div>

      <div>
        <label
          htmlFor="transaction-name"
          className="block text-sm font-medium text-text-secondary mb-1"
        >
          {FORM_LABELS.NAME_REQUIRED}
        </label>
        <input
          id="transaction-name"
          className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none"
          placeholder="Ex: Supermercado"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="transaction-amount"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            {FORM_LABELS.VALUE_REQUIRED}
          </label>
          <input
            id="transaction-amount"
            type="number"
            step="0.01"
            min="0"
            className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none"
            placeholder="0,00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </div>
        <div>
          <label
            htmlFor="transaction-date"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            {FORM_LABELS.DATE}
          </label>
          <input
            id="transaction-date"
            type="date"
            className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary focus:border-accent outline-none"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
      </div>

      <CategorySelect
        categories={availableCategories}
        value={
          form.categoryId ? (form.categoryId as Id<"categories">) : undefined
        }
        onChange={(id) => setForm({ ...form, categoryId: id ?? "" })}
        placeholder={CATEGORY_SELECT.NO_CATEGORY}
        label={FORM_LABELS.CATEGORY}
      />

      <div>
        <label
          htmlFor="transaction-description"
          className="block text-sm font-medium text-text-secondary mb-1"
        >
          {FORM_LABELS.DESCRIPTION}
        </label>
        <textarea
          id="transaction-description"
          className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none resize-none"
          placeholder="Adicione uma descrição..."
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-text-secondary mb-1">
          {FORM_LABELS.STATUS}
        </span>
        <div
          className="flex rounded-button overflow-hidden border border-border"
          role="group"
          aria-label="Status da transação"
        >
          {(["pending", "paid"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                form.status === s
                  ? "bg-accent text-surface-page"
                  : "text-text-muted hover:bg-surface-elevated"
              }`}
              onClick={() => setForm({ ...form, status: s })}
              aria-pressed={form.status === s}
            >
              {s === "pending" ? STATUS_LABELS.PENDING : STATUS_LABELS.PAID}
            </button>
          ))}
        </div>
      </div>

      {form.type === "expense" && (
        <>
          <Toggle
            checked={form.isCredit}
            onChange={(checked) => setForm({ ...form, isCredit: checked })}
            label={FORM_LABELS.CREDIT_CARD}
            icon={<CreditCard size={15} />}
          />

          {form.isCredit && creditCards.length > 0 && (
            <div>
              <label
                htmlFor="credit-card-select"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                {FORM_LABELS.SELECT_CARD}
              </label>
              <select
                id="credit-card-select"
                className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary focus:border-accent outline-none"
                value={form.creditCardId}
                onChange={(e) =>
                  setForm({ ...form, creditCardId: e.target.value })
                }
              >
                <option value="">Selecionar cartão</option>
                {creditCards.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.isCredit && !form.isRecurring && !form.isSubscription && (
            <div>
              <label
                htmlFor="installments-input"
                className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-1.5"
              >
                <Layers size={15} /> {FORM_LABELS.INSTALLMENTS}
              </label>
              <input
                id="installments-input"
                type="number"
                min="1"
                max="48"
                className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary focus:border-accent outline-none"
                value={form.installments}
                onChange={(e) =>
                  setForm({ ...form, installments: e.target.value })
                }
              />
            </div>
          )}

          {form.isCredit && (
            <Toggle
              checked={form.isSubscription}
              onChange={(checked) =>
                setForm({
                  ...form,
                  isSubscription: checked,
                  isRecurring: checked,
                  installments: "1",
                })
              }
              label={FORM_LABELS.IS_SUBSCRIPTION}
              icon={<BadgeCheck size={15} />}
            />
          )}
        </>
      )}

      <Toggle
        checked={form.isRecurring}
        onChange={(checked) =>
          setForm({
            ...form,
            isRecurring: checked,
            installments: "1",
          })
        }
        label={FORM_LABELS.RECURRING}
        icon={<RefreshCw size={15} />}
      />

      <Toggle
        checked={form.includeInStats}
        onChange={(checked) => setForm({ ...form, includeInStats: checked })}
        label={FORM_LABELS.INCLUDE_IN_STATS}
      />

      <button
        type="submit"
        onClick={onSubmit}
        disabled={!form.name.trim() || !form.amount}
        className="w-full py-3 bg-accent text-surface-page rounded-button font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
        aria-disabled={!form.name.trim() || !form.amount}
      >
        {ACTIONS.ADD}
      </button>
    </div>
  );
});
