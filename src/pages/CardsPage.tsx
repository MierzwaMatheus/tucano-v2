import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, CreditCard, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { formatBRL } from "../lib/currency";
import { MonthNavigator } from "../components/MonthNavigator";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";

const CARD_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#64748b",
];

export function CardsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Id<"creditCards"> | null>(null);
  const [disableTarget, setDisableTarget] = useState<Id<"creditCards"> | null>(null);

  const cards = useQuery(api.creditCards.list) ?? [];
  const createCard = useMutation(api.creditCards.create);
  const disableCard = useMutation(api.creditCards.disable);
  const payFatura = useMutation(api.creditCards.payFatura);

  const fatura = useQuery(
    api.creditCards.listFatura,
    selectedCard ? { cardId: selectedCard, month, year } : "skip"
  ) ?? [];

  const [form, setForm] = useState({
    name: "",
    closingDay: "10",
    paymentDay: "20",
    color: CARD_COLORS[0],
  });

  async function handleCreate() {
    if (!form.name.trim()) return;
    await createCard({
      name: form.name.trim(),
      closingDay: parseInt(form.closingDay) || 10,
      paymentDay: parseInt(form.paymentDay) || 20,
      color: form.color,
    });
    setShowCreate(false);
    setForm({ name: "", closingDay: "10", paymentDay: "20", color: CARD_COLORS[0] });
  }

  const selectedCardData = cards.find((c) => c._id === selectedCard);
  const faturaTotal = fatura.reduce((sum, t) => sum + t.amountCents, 0);
  const faturaUnpaid = fatura.filter((t) => t.status === "pending");

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cartões</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cards.length} cartão{cards.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-sm"
        >
          <Plus size={18} />
          Novo Cartão
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Nenhum cartão cadastrado</p>
          <p className="text-gray-400 text-sm mt-1">Adicione seus cartões de crédito</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {cards.map((card) => (
            <div
              key={card._id}
              className={`rounded-2xl border shadow-sm overflow-hidden cursor-pointer transition-all ${
                selectedCard === card._id ? "border-primary ring-2 ring-primary/20" : "border-gray-100"
              }`}
              onClick={() => setSelectedCard(selectedCard === card._id ? null : card._id)}
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
                    onClick={(e) => { e.stopPropagation(); setDisableTarget(card._id); }}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
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
            <MonthNavigator month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
            {faturaUnpaid.length > 0 && (
              <button
                onClick={() => payFatura({ cardId: selectedCard, month, year })}
                className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-hover transition-colors"
              >
                Pagar fatura
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total da fatura</span>
              <span className="font-bold text-lg text-gray-900">{formatBRL(faturaTotal)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-400">Pendente</span>
              <span className="text-sm text-orange-500 font-medium">
                {formatBRL(faturaUnpaid.reduce((s, t) => s + t.amountCents, 0))}
              </span>
            </div>
          </div>

          {fatura.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">Nenhuma transação neste período</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fatura.map((tx) => (
                <div key={tx._id} className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3">
                  <div className="flex-shrink-0">
                    {tx.status === "paid" ? (
                      <CheckCircle2 size={18} className="text-blue-500" />
                    ) : (
                      <Circle size={18} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{tx.name}</div>
                    {tx.installmentNumber && tx.totalInstallments && (
                      <div className="text-xs text-gray-400">
                        Parcela {tx.installmentNumber}/{tx.totalInstallments}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      tx.status === "paid" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                    }`}>
                      {tx.status === "paid" ? "Pago" : "Pendente"}
                    </span>
                    <span className="font-semibold text-sm text-gray-900">{formatBRL(tx.amountCents)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <Modal title="Novo Cartão" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do cartão *</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                placeholder="Ex: Nubank"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia de fechamento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  value={form.closingDay}
                  onChange={(e) => setForm({ ...form, closingDay: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia de vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  value={form.paymentDay}
                  onChange={(e) => setForm({ ...form, paymentDay: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
              <div className="flex flex-wrap gap-2">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""}`}
                    style={{ background: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!form.name.trim()}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              Criar Cartão
            </button>
          </div>
        </Modal>
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
