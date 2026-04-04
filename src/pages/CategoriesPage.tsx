import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, Tag, Pencil, X, Check } from "lucide-react";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";

const CATEGORY_COLORS = [
  "#2BD97F",
  "#1FA85F",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#6366f1",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#64748b",
  "#be185d",
];

const CATEGORY_ICONS = [
  "🛒",
  "🍔",
  "🏠",
  "🚗",
  "💊",
  "📚",
  "🎮",
  "✈️",
  "👗",
  "💡",
  "🐾",
  "🎁",
];

type CategoryType = "shopping" | "income" | "expense" | "all";

const TYPE_LABELS: Record<CategoryType, string> = {
  shopping: "Compras",
  income: "Receita",
  expense: "Despesa",
  all: "Geral",
};

const TYPE_COLORS: Record<CategoryType, string> = {
  shopping: "bg-accent-subtle text-accent",
  income: "bg-accent-subtle text-accent",
  expense: "bg-status-error/10 text-status-error",
  all: "bg-surface-elevated text-text-secondary",
};

export function CategoriesPage() {
  const categories = useQuery(api.categories.list, {}) ?? [];
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const deactivateCategory = useMutation(api.categories.deactivate);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Id<"categories"> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Id<"categories"> | null>(
    null,
  );
  const [filterType, setFilterType] = useState<CategoryType | "">("");

  const [form, setForm] = useState({
    name: "",
    type: "expense" as CategoryType,
    color: CATEGORY_COLORS[0],
    icon: CATEGORY_ICONS[0],
  });

  const [editForm, setEditForm] = useState({
    name: "",
    color: CATEGORY_COLORS[0],
    icon: CATEGORY_ICONS[0],
  });

  const filtered = filterType
    ? categories.filter((c) => c.type === filterType)
    : categories;

  async function handleCreate() {
    if (!form.name.trim()) return;
    await createCategory({
      name: form.name.trim(),
      type: form.type,
      color: form.color,
      icon: form.icon,
    });
    setShowCreate(false);
    setForm({
      name: "",
      type: "expense",
      color: CATEGORY_COLORS[0],
      icon: CATEGORY_ICONS[0],
    });
  }

  function openEdit(cat: {
    _id: Id<"categories">;
    name: string;
    color?: string;
    icon?: string;
  }) {
    setEditTarget(cat._id);
    setEditForm({
      name: cat.name,
      color: cat.color ?? CATEGORY_COLORS[0],
      icon: cat.icon ?? CATEGORY_ICONS[0],
    });
  }

  async function handleEdit() {
    if (!editTarget || !editForm.name.trim()) return;
    await updateCategory({
      id: editTarget,
      name: editForm.name.trim(),
      color: editForm.color,
      icon: editForm.icon,
    });
    setEditTarget(null);
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Categorias</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {categories.length} categoria{categories.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-accent text-surface-page px-4 py-2.5 rounded-button font-medium hover:bg-accent-hover transition-colors shadow-card"
        >
          <Plus size={18} />
          Nova
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType("")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filterType === ""
              ? "bg-accent text-surface-page"
              : "bg-surface-elevated text-text-secondary hover:bg-surface-card"
          }`}
        >
          Todas
        </button>
        {(["expense", "income", "shopping", "all"] as CategoryType[]).map(
          (t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterType === t
                  ? "bg-accent text-surface-page"
                  : "bg-surface-elevated text-text-secondary hover:bg-surface-card"
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ),
        )}
      </div>

      {filtered.length === 0 ? (
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
          <p className="text-text-secondary font-medium">Nenhuma categoria</p>
          <p className="text-text-muted text-sm mt-1">
            Crie categorias para organizar suas finanças
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((cat) => (
            <div
              key={cat._id}
              className="bg-surface-card rounded-card border border-border-subtle shadow-card flex items-center gap-3 px-4 py-3"
            >
              <div
                className="w-9 h-9 rounded-button flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: (cat.color ?? "#6366f1") + "22" }}
              >
                {cat.icon ?? "🏷️"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text-primary truncate">
                  {cat.name}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[cat.type as CategoryType]}`}
                >
                  {TYPE_LABELS[cat.type as CategoryType]}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 text-text-muted hover:text-accent transition-colors rounded-button hover:bg-surface-elevated"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteTarget(cat._id)}
                  className="p-1.5 text-text-muted hover:text-status-error transition-colors rounded-button hover:bg-surface-elevated"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal title="Nova Categoria" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="category-name"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Nome *
              </label>
              <input
                id="category-name"
                className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none"
                placeholder="Ex: Alimentação"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-text-secondary mb-1">
                Tipo
              </span>
              <div
                className="grid grid-cols-2 gap-2"
                role="radiogroup"
                aria-label="Tipo da categoria"
              >
                {(
                  ["expense", "income", "shopping", "all"] as CategoryType[]
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`py-2 rounded-button text-sm font-medium border transition-colors ${
                      form.type === t
                        ? "border-accent bg-accent-subtle text-accent"
                        : "border-border text-text-muted hover:bg-surface-elevated"
                    }`}
                    aria-checked={form.type === t}
                    role="radio"
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-sm font-medium text-text-secondary mb-2">
                Ícone
              </span>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Selecione um ícone"
              >
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    className={`w-9 h-9 rounded-button text-lg flex items-center justify-center transition-all ${
                      form.icon === icon
                        ? "ring-2 ring-accent bg-accent-subtle scale-110"
                        : "bg-surface-elevated hover:bg-surface-card"
                    }`}
                    aria-checked={form.icon === icon}
                    role="radio"
                    aria-label={`Ícone ${icon}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-sm font-medium text-text-secondary mb-2">
                Cor
              </span>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Selecione uma cor"
              >
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      form.color === c
                        ? "scale-125 ring-2 ring-offset-1 ring-offset-surface-card ring-text-muted"
                        : ""
                    }`}
                    style={{ background: c }}
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
              Criar Categoria
            </button>
          </div>
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal title="Editar Categoria" onClose={() => setEditTarget(null)}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-category-name"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Nome *
              </label>
              <input
                id="edit-category-name"
                className="w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary focus:border-accent outline-none"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-text-secondary mb-2">
                Ícone
              </span>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Selecione um ícone"
              >
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, icon })}
                    className={`w-9 h-9 rounded-button text-lg flex items-center justify-center transition-all ${
                      editForm.icon === icon
                        ? "ring-2 ring-accent bg-accent-subtle scale-110"
                        : "bg-surface-elevated hover:bg-surface-card"
                    }`}
                    aria-checked={editForm.icon === icon}
                    role="radio"
                    aria-label={`Ícone ${icon}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-sm font-medium text-text-secondary mb-2">
                Cor
              </span>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Selecione uma cor"
              >
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, color: c })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      editForm.color === c
                        ? "scale-125 ring-2 ring-offset-1 ring-offset-surface-card ring-text-muted"
                        : ""
                    }`}
                    style={{ background: c }}
                    aria-checked={editForm.color === c}
                    role="radio"
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="flex-1 py-2.5 rounded-button border border-border text-text-secondary font-medium hover:bg-surface-elevated transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleEdit}
                disabled={!editForm.name.trim()}
                className="flex-1 py-2.5 bg-accent text-surface-page rounded-button font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                aria-disabled={!editForm.name.trim()}
              >
                <Check size={16} /> Salvar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remover categoria?"
          message="A categoria será desativada. As transações associadas serão mantidas."
          confirmLabel="Remover"
          danger
          onConfirm={async () => {
            await deactivateCategory({ id: deleteTarget });
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
