import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, CreditCard, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { formatBRL } from "../lib/currency";
import { MonthNavigator } from "../components/MonthNavigator";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  FloatingActionButton,
  ResponsiveModal,
} from "../components/FloatingActionButton";

const CARD_COLORS = [
  "#2BD97F",
  "#1FA85F",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#6366f1",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#64748b",
];

export function CardsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Id<"creditCards"> | null>(
    null,
  );
  const [disableTarget, setDisableTarget] = useState<Id<"creditCards"> | null>(
    null,
  );

  const cards = useQuery(api.creditCards.list) ?? [];
  const createCard = useMutation(api.creditCards.create);
  const disableCard = useMutation(api.creditCards.disable);
  const payFatura = useMutation(api.creditCards.payFatura);

  const fatura =
    useQuery(
      api.creditCards.listFatura,
      selectedCard ? { cardId: selectedCard, month, year } : "skip",
    ) ?? [];

  const [form, setForm] = useState({
    name: "",
    closingDay: "10",
    paymentDay: "20",
    creditLimit: "",
    color: CARD_COLORS[0],
  });

  async function handleCreate() {
    if (!form.name.trim()) return;
    await createCard({
      name: form.name.trim(),
      closingDay: parseInt(form.closingDay) || 10,
      paymentDay: parseInt(form.paymentDay) || 20,
      color: form.color,
      creditLimitCents: form.creditLimit
        ? Math.round(parseFloat(form.creditLimit) * 100)
        : undefined,
    });
    setShowCreate(false);
    setForm({
      name: "",
      closingDay: "10",
      paymentDay: "20",
      creditLimit: "",
      color: CARD_COLORS[0],
    });
  }

  const selectedCardData = cards.find((c) => c._id === selectedCard);
  const faturaTotal = fatura.reduce((sum, t) => sum + t.amountCents, 0);
  const faturaUnpaid = fatura.filter((t) => t.status === "pending");

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Cartões</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {cards.length} cartão{cards.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="hidden md:flex items-center gap-2 bg-accent text-surface-page px-4 py-2.5 rounded-button font-medium hover:bg-accent-hover transition-colors shadow-card"
        >
          <Plus size={18} />
          Novo Cartão
        </button>
      </div>

      {cards.length === 0 ? (
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
            Nenhum cartão cadastrado
          </p>
          <p className="text-text-muted text-sm mt-1">
            Adicione seus cartões de crédito
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {cards.map((card) => (
            <div
              key={card._id}
              className={`rounded-card border shadow-card overflow-hidden cursor-pointer transition-all ${
                selectedCard === card._id
                  ? "border-accent ring-2 ring-accent/20"
                  : "border-border-subtle"
              }`}
              onClick={() =>
                setSelectedCard(selectedCard === card._id ? null : card._id)
              }
            >
              <div
                className="p-4 text-white"
                style={{ background: card.color ?? "#6366f1" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={20} />
                    <span className="font-bold text-lg">{card.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDisableTarget(card._id);
                    }}
                    className="p-1.5 rounded-button bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-white/80">
                  <span>Fecha dia {card.closingDay}</span>
                  <span>Vence dia {card.paymentDay}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCard && selectedCardData && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <MonthNavigator
              month={month}
              year={year}
              onChange={(m, y) => {
                setMonth(m);
                setYear(y);
              }}
            />
            {faturaUnpaid.length > 0 && (
              <button
                onClick={() => payFatura({ cardId: selectedCard, month, year })}
                className="text-sm bg-accent text-surface-page px-3 py-1.5 rounded-button hover:bg-accent-hover transition-colors"
              >
                Pagar fatura
              </button>
            )}
          </div>

          <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-4 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">
                Total da fatura
              </span>
              <span className="font-bold text-lg text-text-primary">
                {formatBRL(faturaTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-text-muted">Pendente</span>
              <span className="text-sm text-status-warning font-medium">
                {formatBRL(faturaUnpaid.reduce((s, t) => s + t.amountCents, 0))}
              </span>
            </div>
          </div>

          {fatura.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-text-muted text-sm">
                Nenhuma transação neste período
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {fatura.map((tx) => (
                <div
                  key={tx._id}
                  className="bg-surface-card rounded-card border border-border-subtle shadow-card flex items-center gap-3 px-4 py-3"
                >
                  <div className="flex-shrink-0">
                    {tx.status === "paid" ? (
                      <CheckCircle2 size={18} className="text-accent" />
                    ) : (
                      <Circle size={18} className="text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary text-sm truncate">
                      {tx.name}
                    </div>
                    {tx.installmentNumber && tx.totalInstallments && (
                      <div className="text-xs text-text-muted">
                        Parcela {tx.installmentNumber}/{tx.totalInstallments}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        tx.status === "paid"
                          ? "bg-accent-subtle text-accent"
                          : "bg-status-warning/10 text-status-warning"
                      }`}
                    >
                      {tx.status === "paid" ? "Pago" : "Pendente"}
                    </span>
                    <span className="font-semibold text-sm text-text-primary">
                      {formatBRL(tx.amountCents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <FloatingActionButton
        onClick={() => setShowCreate(true)}
        ariaLabel="Novo cartão"
      />

      {showCreate && (
        <ResponsiveModal
          title="Novo Cartão"
          onClose={() => setShowCreate(false)}
          isOpen={showCreate}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="card-name"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Nome do cartão *
              </label>
              <input
                id="card-name"
                className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none"
                placeholder="Ex: Nubank"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="card-closing-day"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Dia de fechamento
                </label>
                <input
                  id="card-closing-day"
                  type="number"
                  min="1"
                  max="31"
                  className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary focus:border-accent outline-none"
                  value={form.closingDay}
                  onChange={(e) =>
                    setForm({ ...form, closingDay: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="card-payment-day"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Dia de vencimento
                </label>
                <input
                  id="card-payment-day"
                  type="number"
                  min="1"
                  max="31"
                  className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary focus:border-accent outline-none"
                  value={form.paymentDay}
                  onChange={(e) =>
                    setForm({ ...form, paymentDay: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="card-limit"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Limite de crédito
              </label>
              <input
                id="card-limit"
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none"
                placeholder="Ex: 5000.00"
                value={form.creditLimit}
                onChange={(e) =>
                  setForm({ ...form, creditLimit: e.target.value })
                }
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-text-secondary mb-2">
                Cor
              </span>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Selecione a cor do cartão"
              >
                {CARD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-transform ${
                      form.color === c
                        ? "scale-125 ring-2 ring-offset-1 ring-offset-surface-card ring-text-muted"
                        : ""
                    }`}
                    style={{ background: c }}
                    onClick={() => setForm({ ...form, color: c })}
                    aria-checked={form.color === c}
                    role="radio"
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              onClick={handleCreate}
              disabled={!form.name.trim()}
              className="w-full py-3 bg-accent text-surface-page rounded-button font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
              aria-disabled={!form.name.trim()}
            >
              Criar Cartão
            </button>
          </div>
        </ResponsiveModal>
      )}

      {disableTarget && (
        <ConfirmDialog
          title="Remover cartão?"
          message="O cartão será desativado. As transações associadas serão mantidas."
          confirmLabel="Remover"
          danger
          onConfirm={async () => {
            await disableCard({ id: disableTarget });
            if (selectedCard === disableTarget) setSelectedCard(null);
            setDisableTarget(null);
          }}
          onCancel={() => setDisableTarget(null)}
        />
      )}
    </div>
  );
}
