import { useState, useRef, ChangeEvent } from "react";
import { useSettings } from "../hooks/useSettings";
import { User, Upload, Trash2, X, Save, Lock } from "lucide-react";

export function SettingsPage() {
  const {
    user,
    isUpdatingName,
    setIsUpdatingName,
    name,
    setName,
    uploadingPhoto,
    error,
    handleSaveName,
    handlePhotoUpload,
    handleRemovePhoto,
  } = useSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameEdit = () => {
    setName(user?.name ?? "");
    setIsUpdatingName(true);
  };

  const handleNameCancel = () => {
    setIsUpdatingName(false);
    setName("");
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Configurações
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-status-error/10 border border-status-error rounded-button text-status-error text-sm">
          {error}
        </div>
      )}

      <section className="bg-surface-card rounded-card border border-border-subtle p-6 mb-4">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Informações do Perfil
        </h2>

        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full bg-surface-elevated border-2 border-border-subtle flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent-primary transition-colors"
              onClick={handlePhotoClick}
            >
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-text-muted" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploadingPhoto}
            />
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex gap-2 mb-2">
              <button
                onClick={handlePhotoClick}
                disabled={uploadingPhoto}
                className="px-4 py-2 rounded-button bg-surface-elevated text-text-secondary font-medium hover:bg-surface-elevated/80 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Upload size={16} />
                {user?.photoUrl ? "Alterar" : "Enviar"}
              </button>
              {user?.photoUrl && (
                <button
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  className="px-4 py-2 rounded-button border border-border-subtle text-text-muted font-medium hover:bg-surface-elevated transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Remover
                </button>
              )}
            </div>
            <p className="text-text-secondary text-sm">
              JPG, PNG ou GIF. Tamanho máx 2MB.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Nome de Exibição
            </label>
            {isUpdatingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-input bg-surface-elevated border border-border-subtle text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="Seu nome"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="px-4 py-2.5 rounded-button bg-accent-primary text-surface-page font-medium hover:bg-accent-primary/80 transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  Salvar
                </button>
                <button
                  onClick={handleNameCancel}
                  className="px-4 py-2.5 rounded-button border border-border-subtle text-text-secondary font-medium hover:bg-surface-elevated transition-colors flex items-center gap-2"
                >
                  <X size={18} />
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-input bg-surface-elevated border border-border-subtle">
                <span className="text-text-primary font-medium">
                  {user?.name ?? "Não definido"}
                </span>
                <button
                  onClick={handleNameEdit}
                  className="px-4 py-2 rounded-button bg-surface-elevated text-text-secondary font-medium hover:bg-surface-elevated/80 transition-colors"
                >
                  Editar
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              E-mail
            </label>
            <div className="p-4 rounded-input bg-surface-elevated border border-border-subtle text-text-primary">
              {user?.email ?? "Não definido"}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-card rounded-card border border-border-subtle p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Segurança
        </h2>
        <div className="flex items-center gap-3 text-text-secondary">
          <Lock size={18} />
          <p className="text-sm">
            Alteração de senha disponível na próxima atualização.
          </p>
        </div>
      </section>
    </div>
  );
}
