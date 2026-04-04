import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Plus,
  ShoppingCart,
  CheckCircle2,
  Circle,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Package,
} from "lucide-react";
import { formatBRL, toCents, fromCents } from "../lib/currency";
import { MONTHS } from "../lib/dates";
import {
  CATEGORY_SELECT,
  FORM_LABELS,
  ACTIONS,
  EMPTY_STATES,
  TYPE_LABELS,
  SHOPPING_LABELS,
  MODAL_TITLES,
} from "../lib/ui-strings";
import { Modal } from "../components/Modal";
import { CategorySelect } from "../components/CategorySelect";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  useMonetaryInput,
  formatMonetaryValue,
} from "@/hooks/useMonetaryInput";

export function ShoppingPage() {
  const [selectedListId, setSelectedListId] =
    useState<Id<"shoppingLists"> | null>(null);

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

function ListsOverview({
  onSelectList,
}: {
  onSelectList: (id: Id<"shoppingLists">) => void;
}) {
  const lists = useQuery(api.shoppingLists.list) ?? [];
  const createList = useMutation(api.shoppingLists.create);
  const removeList = useMutation(api.shoppingLists.remove);
  const completeList = useMutation(api.shoppingLists.complete);

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Id<"shoppingLists"> | null>(
    null,
  );

  const now = new Date();
  const [form, setForm] = useState({
    name: "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    budget: "",
  });

  const handleBudgetChange = useMonetaryInput(
    form.budget,
    useCallback(
      (_formattedValue: string, numericValue: string) => {
        setForm({ ...form, budget: numericValue });
      },
      [form],
    ),
  );

  async function handleCreate() {
    if (!form.name.trim()) return;
    await createList({
      name: form.name.trim(),
      month: form.month,
      year: form.year,
      budgetCents: toCents(parseFloat(form.budget) || 0),
    });
    setShowCreate(false);
    setForm({
      name: "",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      budget: "",
    });
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Listas de Compras
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {lists.length} lista{lists.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-accent text-surface-page px-4 py-2.5 rounded-button font-medium hover:bg-accent-hover transition-colors shadow-card"
        >
          <Plus size={18} />
          {SHOPPING_LABELS.NEW_LIST}
        </button>
      </div>

      {lists.length === 0 ? (
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
            {EMPTY_STATES.NO_LIST}
          </p>
          <p className="text-text-muted text-sm mt-1">
            {EMPTY_STATES.NO_LIST_HINT}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => {
            const pct =
              list.budgetCents > 0
                ? Math.min(100, (list.totalCents / list.budgetCents) * 100)
                : 0;
            const over =
              list.totalCents > list.budgetCents && list.budgetCents > 0;
            return (
              <div
                key={list._id}
                className="bg-surface-card rounded-card border border-border-subtle shadow-card overflow-hidden"
              >
                <button
                  className="w-full p-4 text-left hover:bg-surface-elevated transition-colors"
                  onClick={() => onSelectList(list._id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {list.status === "completed" ? (
                        <CheckCircle2 size={18} className="text-accent" />
                      ) : (
                        <ShoppingCart size={18} className="text-accent" />
                      )}
                      <span className="font-semibold text-text-primary">
                        {list.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">
                        {MONTHS[list.month - 1]} {list.year}
                      </span>
                      <ChevronRight size={16} className="text-text-muted" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span
                      className={
                        over
                          ? "text-status-error font-medium"
                          : "text-text-secondary"
                      }
                    >
                      {formatBRL(list.totalCents)}
                    </span>
                    {list.budgetCents > 0 && (
                      <span className="text-text-muted">
                        de {formatBRL(list.budgetCents)}
                      </span>
                    )}
                  </div>
                  {list.budgetCents > 0 && (
                    <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${over ? "bg-status-error" : "bg-accent"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </button>
                <div className="px-4 pb-3 flex justify-end gap-3">
                  {list.status === "active" && (
                    <button
                      onClick={() => completeList({ id: list._id })}
                      className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 size={13} />
                      Concluir
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(list._id)}
                    className="text-xs text-text-muted hover:text-status-error flex items-center gap-1 transition-colors"
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
        <Modal
          title="{SHOPPING_LABELS.NEW_LIST_TITLE}"
          onClose={() => setShowCreate(false)}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="list-name"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Nome
              </label>
              <input
                id="list-name"
                className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                placeholder="Ex: Mercado de abril"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="list-month"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Mês
                </label>
                <select
                  id="list-month"
                  className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary focus:border-accent outline-none"
                  value={form.month}
                  onChange={(e) =>
                    setForm({ ...form, month: parseInt(e.target.value) })
                  }
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="list-year"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Ano
                </label>
                <input
                  id="list-year"
                  type="number"
                  className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary focus:border-accent outline-none"
                  value={form.year}
                  onChange={(e) =>
                    setForm({ ...form, year: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="list-budget"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Orçamento (R$)
              </label>
              <input
                id="list-budget"
                type="text"
                inputMode="numeric"
                className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none"
                placeholder="0,00"
                value={formatMonetaryValue(form.budget)}
                onChange={handleBudgetChange}
              />
            </div>
            <button
              type="submit"
              onClick={handleCreate}
              disabled={!form.name.trim()}
              className="w-full py-3 bg-accent text-surface-page rounded-button font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
              aria-disabled={!form.name.trim()}
            >
              {SHOPPING_LABELS.CREATE_LIST}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir lista?"
          message="Todos os itens desta lista serão removidos permanentemente."
          confirmLabel={ACTIONS.DELETE}
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

function ListDetail({
  listId,
  onBack,
}: {
  listId: Id<"shoppingLists">;
  onBack: () => void;
}) {
  const data = useQuery(api.shoppingLists.getWithItems, { listId });
  const addItem = useMutation(api.shoppingItems.addItem);
  const togglePurchased = useMutation(api.shoppingItems.togglePurchased);
  const deleteItem = useMutation(api.shoppingItems.deleteItem);
  const completeList = useMutation(api.shoppingLists.complete);
  const catalogResults = useQuery(api.productCatalog.search, { term: "" });
  const categories = useQuery(api.categories.list, { type: "shopping" }) ?? [];

  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchResults = useQuery(api.productCatalog.search, {
    term: searchTerm,
  });

  const [form, setForm] = useState({
    name: "",
    unit: "un",
    quantity: "1",
    price: "",
    brand: "",
    catalogItemId: undefined as Id<"productCatalog"> | undefined,
    categoryId: undefined as Id<"categories"> | undefined,
  });

  const handlePriceChange = useMonetaryInput(
    form.price,
    useCallback(
      (_formattedValue: string, numericValue: string) => {
        setForm({ ...form, price: numericValue });
      },
      [form],
    ),
  );

  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  const { items, ...list } = data;
  const purchased = items.filter((i) => i.isPurchased);
  const pending = items.filter((i) => !i.isPurchased);
  const pct =
    list.budgetCents > 0
      ? Math.min(100, (list.totalCents / list.budgetCents) * 100)
      : 0;
  const over = list.totalCents > list.budgetCents && list.budgetCents > 0;

  function selectCatalogItem(item: {
    _id: Id<"productCatalog">;
    name: string;
    defaultUnit: string;
    defaultBrand?: string;
    lastPriceCents: number;
    categoryId?: Id<"categories">;
  }) {
    setForm({
      name: item.name,
      unit: item.defaultUnit,
      quantity: "1",
      price: fromCents(item.lastPriceCents).toFixed(2),
      brand: item.defaultBrand ?? "",
      catalogItemId: item._id,
      categoryId: item.categoryId,
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
      categoryId: form.categoryId,
    });
    setShowAdd(false);
    setForm({
      name: "",
      unit: "un",
      quantity: "1",
      price: "",
      brand: "",
      catalogItemId: undefined,
      categoryId: undefined,
    });
    setSearchTerm("");
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-button hover:bg-surface-elevated transition-colors text-text-muted hover:text-text-secondary"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">{list.name}</h1>
          <p className="text-sm text-text-muted">
            {MONTHS[list.month - 1]} {list.year}
          </p>
        </div>
        {list.status === "completed" && (
          <span className="text-xs bg-accent-subtle text-accent px-2.5 py-1 rounded-full font-medium">
            Concluída
          </span>
        )}
      </div>

      {/* Budget bar */}
      <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-secondary">Total gasto</span>
          <span
            className={`font-bold text-lg ${over ? "text-status-error" : "text-text-primary"}`}
          >
            {formatBRL(list.totalCents)}
          </span>
        </div>
        {list.budgetCents > 0 && (
          <>
            <div className="h-2 bg-surface-elevated rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all ${over ? "bg-status-error" : "bg-accent"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>{pct.toFixed(0)}% do orçamento</span>
              <span>Orçamento: {formatBRL(list.budgetCents)}</span>
            </div>
          </>
        )}
      </div>

      {list.status === "active" && (
        <button
          onClick={() => completeList({ id: list._id })}
          className="w-full py-3 bg-accent text-surface-page rounded-button font-semibold hover:bg-accent-hover transition-colors mb-4"
        >
          <CheckCircle2 size={18} className="inline mr-2" />
          Concluir Lista
        </button>
      )}

      {/* Add item button */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-accent/30 text-accent rounded-card font-medium hover:border-accent/60 hover:bg-accent-subtle transition-colors mb-4"
      >
        <Plus size={18} />
        {SHOPPING_LABELS.ADD_ITEM_BUTTON}
      </button>

      {/* Pending items */}
      {pending.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            {SHOPPING_LABELS.TO_BUY} ({pending.length})
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
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            {SHOPPING_LABELS.PURCHASED} ({purchased.length})
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
          <svg
            className="mx-auto mb-3"
            width="60"
            height="30"
            viewBox="0 0 60 30"
          >
            <line
              x1="0"
              y1="15"
              x2="60"
              y2="15"
              stroke="#6B7078"
              strokeWidth="1"
            />
            <circle cx="15" cy="15" r="2" fill="#6B7078" />
            <circle cx="30" cy="15" r="2" fill="#6B7078" />
            <circle cx="45" cy="15" r="2" fill="#6B7078" />
          </svg>
          <p className="text-text-muted">Nenhum item ainda</p>
        </div>
      )}

      {showAdd && (
        <Modal
          title={MODAL_TITLES.ADD_ITEM}
          onClose={() => {
            setShowAdd(false);
            setSearchTerm("");
          }}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="item-search"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                {SHOPPING_LABELS.SEARCH_CATALOG}
              </label>
              <input
                id="item-search"
                className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none"
                placeholder="Digite para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-describedby="search-hint"
              />
              {searchTerm.length >= 2 &&
                searchResults &&
                searchResults.length > 0 && (
                  <ul
                    className="mt-1 border border-border rounded-input overflow-hidden shadow-card"
                    role="listbox"
                  >
                    {searchResults.map((r) => (
                      <li key={r._id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2.5 hover:bg-surface-elevated transition-colors border-b last:border-b-0 border-border-subtle"
                          onClick={() => selectCatalogItem(r)}
                          aria-label={`Selecionar ${r.name}`}
                        >
                          <div className="font-medium text-text-primary text-sm">
                            {r.name}
                          </div>
                          <div className="text-xs text-text-muted">
                            {r.defaultUnit} · {formatBRL(r.lastPriceCents)}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>

            <div>
              <label
                htmlFor="item-name"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                {FORM_LABELS.NAME_REQUIRED}
              </label>
              <input
                id="item-name"
                className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none"
                placeholder="Ex: Arroz"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    catalogItemId: undefined,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="item-quantity"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  {FORM_LABELS.QUANTITY}
                </label>
                <input
                  id="item-quantity"
                  type="number"
                  step="0.001"
                  min="0.001"
                  className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary focus:border-accent outline-none"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="item-unit"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  {FORM_LABELS.UNIT}
                </label>
                <select
                  id="item-unit"
                  className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary focus:border-accent outline-none"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  {["un", "kg", "g", "L", "mL", "cx", "pct", "dz"].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="item-price"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                {FORM_LABELS.UNIT_PRICE_REQUIRED}
              </label>
              <input
                id="item-price"
                type="text"
                inputMode="numeric"
                min="0"
                className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none"
                placeholder="0,00"
                value={formatMonetaryValue(form.price)}
                onChange={handlePriceChange}
              />
            </div>

            <div>
              <label
                htmlFor="item-brand"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                {FORM_LABELS.BRAND}
              </label>
              <input
                id="item-brand"
                className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none"
                placeholder="Ex: Camil"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>

            <CategorySelect
              categories={categories}
              value={form.categoryId}
              onChange={(id) => setForm({ ...form, categoryId: id })}
              placeholder={CATEGORY_SELECT.PLACEHOLDER}
              label={FORM_LABELS.CATEGORY_OPTIONAL}
            />

            <button
              type="submit"
              onClick={handleAdd}
              disabled={!form.name.trim() || !form.price}
              className="w-full py-3 bg-accent text-surface-page rounded-button font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
              aria-disabled={!form.name.trim() || !form.price}
            >
              {ACTIONS.ADD}
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
  item: {
    _id: Id<"shoppingItems">;
    name: string;
    quantity: number;
    unit: string;
    unitPriceCents: number;
    totalCents: number;
    brand?: string;
    isPurchased: boolean;
    category?: { name: string; color?: string; icon?: string } | null;
  };
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-surface-card rounded-card border border-border-subtle shadow-card flex items-center gap-3 px-4 py-3">
      <button onClick={onToggle} className="flex-shrink-0">
        {item.isPurchased ? (
          <CheckCircle2 size={22} className="text-accent" />
        ) : (
          <Circle size={22} className="text-text-muted" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div
          className={`font-medium text-text-primary truncate ${item.isPurchased ? "line-through text-text-muted" : ""}`}
        >
          {item.name}
          {item.brand && (
            <span className="text-text-muted font-normal"> · {item.brand}</span>
          )}
        </div>
        <div className="text-xs text-text-muted flex items-center gap-1.5">
          {item.category && (
            <>
              {item.category.icon && <span>{item.category.icon}</span>}
              {item.category.color && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.category.color }}
                />
              )}
              <span>{item.category.name}</span>
            </>
          )}
          {!item.category && (
            <span>
              {item.quantity} {item.unit} × {formatBRL(item.unitPriceCents)}
            </span>
          )}
          {item.category && (
            <span>
              · {item.quantity} {item.unit} × {formatBRL(item.unitPriceCents)}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-semibold text-text-primary text-sm">
          {formatBRL(item.totalCents)}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="flex-shrink-0 p-1.5 text-text-muted hover:text-status-error transition-colors"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
