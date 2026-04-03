import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, ShoppingCart, CheckCircle2, Circle, Trash2, ChevronRight, ArrowLeft, Package } from "lucide-react";
import { formatBRL, toCents, fromCents } from "../lib/currency";
import { MONTHS } from "../lib/dates";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";

export function ShoppingPage() {
  const [selectedListId, setSelectedListId] = useState<Id<"shoppingLists"> | null>(null);

  if (selectedListId) {
    return (
      <ListDetail
        listId={selectedListId}
        onBack={() => setSelectedListId(null)}
      />
    );
  }

  return <ListsOverview onSelectList={setSelectedListId} />;
}

function ListsOverview({ onSelectList }: { onSelectList: (id: Id<"shoppingLists">) => void }) {
  const lists = useQuery(api.shoppingLists.list) ?? [];
  const createList = useMutation(api.shoppingLists.create);
  const removeList = useMutation(api.shoppingLists.remove);

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Id<"shoppingLists"> | null>(null);

  const now = new Date();
  const [form, setForm] = useState({
    name: "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    budget: "",
  });

  async function handleCreate() {
    if (!form.name.trim()) return;
    await createList({
      name: form.name.trim(),
      month: form.month,
      year: form.year,
      budgetCents: toCents(parseFloat(form.budget) || 0),
    });
    setShowCreate(false);
    setForm({ name: "", month: now.getMonth() + 1, year: now.getFullYear(), budget: "" });
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listas de Compras</h1>
          <p className="text-sm text-gray-500 mt-0.5">{lists.length} lista{lists.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-sm"
        >
          <Plus size={18} />
          Nova Lista
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma lista ainda</p>
          <p className="text-gray-400 text-sm mt-1">Crie sua primeira lista de compras</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => {
            const pct = list.budgetCents > 0 ? Math.min(100, (list.totalCents / list.budgetCents) * 100) : 0;
            const over = list.totalCents > list.budgetCents && list.budgetCents > 0;
            return (
              <div
                key={list._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <button
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => onSelectList(list._id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {list.status === "completed" ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : (
                        <ShoppingCart size={18} className="text-primary" />
                      )}
                      <span className="font-semibold text-gray-900">{list.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {MONTHS[list.month - 1]} {list.year}
                      </span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className={over ? "text-red-500 font-medium" : "text-gray-600"}>
                      {formatBRL(list.totalCents)}
                    </span>
                    {list.budgetCents > 0 && (
                      <span className="text-gray-400">de {formatBRL(list.budgetCents)}</span>
                    )}
                  </div>
                  {list.budgetCents > 0 && (
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${over ? "bg-red-400" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </button>
                <div className="px-4 pb-3 flex justify-end">
                  <button
                    onClick={() => setDeleteTarget(list._id)}
                    className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={13} />
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <Modal title="Nova Lista de Compras" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="Ex: Mercado de abril"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento (R$)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                placeholder="0,00"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!form.name.trim()}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              Criar Lista
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir lista?"
          message="Todos os itens desta lista serão removidos permanentemente."
          confirmLabel="Excluir"
          danger
          onConfirm={async () => {
            await removeList({ id: deleteTarget });
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function ListDetail({ listId, onBack }: { listId: Id<"shoppingLists">; onBack: () => void }) {
  const data = useQuery(api.shoppingLists.getWithItems, { listId });
  const addItem = useMutation(api.shoppingItems.addItem);
  const togglePurchased = useMutation(api.shoppingItems.togglePurchased);
  const deleteItem = useMutation(api.shoppingItems.deleteItem);
  const catalogResults = useQuery(api.productCatalog.search, { term: "" });

  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchResults = useQuery(api.productCatalog.search, { term: searchTerm });

  const [form, setForm] = useState({
    name: "",
    unit: "un",
    quantity: "1",
    price: "",
    brand: "",
    catalogItemId: undefined as Id<"productCatalog"> | undefined,
  });

  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const { items, ...list } = data;
  const purchased = items.filter((i) => i.isPurchased);
  const pending = items.filter((i) => !i.isPurchased);
  const pct = list.budgetCents > 0 ? Math.min(100, (list.totalCents / list.budgetCents) * 100) : 0;
  const over = list.totalCents > list.budgetCents && list.budgetCents > 0;

  function selectCatalogItem(item: { _id: Id<"productCatalog">; name: string; defaultUnit: string; defaultBrand?: string; lastPriceCents: number }) {
    setForm({
      name: item.name,
      unit: item.defaultUnit,
      quantity: "1",
      price: fromCents(item.lastPriceCents).toFixed(2),
      brand: item.defaultBrand ?? "",
      catalogItemId: item._id,
    });
    setSearchTerm("");
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.price) return;
    await addItem({
      listId,
      catalogItemId: form.catalogItemId,
      name: form.name.trim(),
      unit: form.unit,
      quantity: parseFloat(form.quantity) || 1,
      unitPriceCents: toCents(parseFloat(form.price) || 0),
      brand: form.brand || undefined,
    });
    setShowAdd(false);
    setForm({ name: "", unit: "un", quantity: "1", price: "", brand: "", catalogItemId: undefined });
    setSearchTerm("");
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{list.name}</h1>
          <p className="text-sm text-gray-500">{MONTHS[list.month - 1]} {list.year}</p>
        </div>
        {list.status === "completed" && (
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
            Concluída
          </span>
        )}
      </div>

      {/* Budget bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Total gasto</span>
          <span className={`font-bold text-lg ${over ? "text-red-500" : "text-gray-900"}`}>
            {formatBRL(list.totalCents)}
          </span>
        </div>
        {list.budgetCents > 0 && (
          <>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all ${over ? "bg-red-400" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{pct.toFixed(0)}% do orçamento</span>
              <span>Orçamento: {formatBRL(list.budgetCents)}</span>
            </div>
          </>
        )}
      </div>

      {/* Add item button */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-primary/30 text-primary rounded-2xl font-medium hover:border-primary/60 hover:bg-primary/5 transition-colors mb-4"
      >
        <Plus size={18} />
        Adicionar Item
      </button>

      {/* Pending items */}
      {pending.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            A comprar ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((item) => (
              <ItemRow
                key={item._id}
                item={item}
                onToggle={() => togglePurchased({ itemId: item._id })}
                onDelete={() => deleteItem({ id: item._id })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Purchased items */}
      {purchased.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Comprados ({purchased.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {purchased.map((item) => (
              <ItemRow
                key={item._id}
                item={item}
                onToggle={() => togglePurchased({ itemId: item._id })}
                onDelete={() => deleteItem({ id: item._id })}
              />
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Nenhum item ainda</p>
        </div>
      )}

      {showAdd && (
        <Modal title="Adicionar Item" onClose={() => { setShowAdd(false); setSearchTerm(""); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar no catálogo</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                placeholder="Digite para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm.length >= 2 && searchResults && searchResults.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {searchResults.map((r) => (
                    <button
                      key={r._id}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b last:border-b-0 border-gray-100"
                      onClick={() => selectCatalogItem(r)}
                    >
                      <div className="font-medium text-gray-900 text-sm">{r.name}</div>
                      <div className="text-xs text-gray-400">{r.defaultUnit} · {formatBRL(r.lastPriceCents)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do produto *</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                placeholder="Ex: Arroz"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, catalogItemId: undefined })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  {["un", "kg", "g", "L", "mL", "cx", "pct", "dz"].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço unitário (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                placeholder="0,00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca (opcional)</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                placeholder="Ex: Camil"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!form.name.trim() || !form.price}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: { _id: Id<"shoppingItems">; name: string; quantity: number; unit: string; unitPriceCents: number; totalCents: number; brand?: string; isPurchased: boolean };
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3">
      <button onClick={onToggle} className="flex-shrink-0">
        {item.isPurchased ? (
          <CheckCircle2 size={22} className="text-green-500" />
        ) : (
          <Circle size={22} className="text-gray-300" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-gray-900 truncate ${item.isPurchased ? "line-through text-gray-400" : ""}`}>
          {item.name}
          {item.brand && <span className="text-gray-400 font-normal"> · {item.brand}</span>}
        </div>
        <div className="text-xs text-gray-400">
          {item.quantity} {item.unit} × {formatBRL(item.unitPriceCents)}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-semibold text-gray-900 text-sm">{formatBRL(item.totalCents)}</div>
      </div>
      <button
        onClick={onDelete}
        className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 transition-colors"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
