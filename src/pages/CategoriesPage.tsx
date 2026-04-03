import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, Tag, Pencil, X, Check } from "lucide-react";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";

const CATEGORY_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#64748b", "#a16207", "#be185d",
];

const CATEGORY_ICONS = ["🛒", "🍔", "🏠", "🚗", "💊", "📚", "🎮", "✈️", "👗", "💡", "🐾", "🎁"];

type CategoryType = "shopping" | "income" | "expense" | "all";

const TYPE_LABELS: Record<CategoryType, string> = {
  shopping: "Compras",
  income: "Receita",
  expense: "Despesa",
  all: "Geral",
};

const TYPE_COLORS: Record<CategoryType, string> = {
  shopping: "bg-blue-100 text-blue-700",
  income: "bg-green-100 text-green-700",
  expense: "bg-red-100 text-red-700",
  all: "bg-gray-100 text-gray-700",
};

export function CategoriesPage() {
  const categories = useQuery(api.categories.list, {}) ?? [];
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const deactivateCategory = useMutation(api.categories.deactivate);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Id<"categories"> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Id<"categories"> | null>(null);
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
    setForm({ name: "", type: "expense", color: CATEGORY_COLORS[0], icon: CATEGORY_ICONS[0] });
  }

  function openEdit(cat: { _id: Id<"categories">; name: string; color?: string; icon?: string }) {
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
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} categoria{categories.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-sm"
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
            filterType === "" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Todas
        </button>
        {(["expense", "income", "shopping", "all"] as CategoryType[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterType === t ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Tag size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma categoria</p>
          <p className="text-gray-400 text-sm mt-1">Crie categorias para organizar suas finanças</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: (cat.color ?? "#6366f1") + "22" }}
              >
                {cat.icon ?? "🏷️"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{cat.name}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[cat.type as CategoryType]}`}>
                  {TYPE_LABELS[cat.type as CategoryType]}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteTarget(cat._id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-50"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                placeholder="Ex: Alimentação"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {(["expense", "income", "shopping", "all"] as CategoryType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t })}
                    className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                      form.type === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setForm({ ...form, icon })}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                      form.icon === icon ? "ring-2 ring-primary bg-primary/10 scale-110" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      form.color === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!form.name.trim()}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setEditForm({ ...editForm, icon })}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                      editForm.icon === icon ? "ring-2 ring-primary bg-primary/10 scale-110" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditForm({ ...editForm, color: c })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      editForm.color === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                disabled={!editForm.name.trim()}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
