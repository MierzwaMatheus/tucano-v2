import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function UserMenu({ onClose }: Props) {
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getCurrentUser);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut();
  };

  const handleNavigateToSettings = () => {
    onClose();
    navigate("/settings");
  };

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute top-14 right-4 bg-surface-card rounded-card shadow-float border border-border-subtle py-2 min-w-[180px]">
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-text-primary font-medium truncate">
            {user?.name || "Usuário"}
          </p>
          <p className="text-text-muted text-sm truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleNavigateToSettings}
          className="w-full px-4 py-2.5 text-left text-text-secondary hover:bg-surface-elevated flex items-center gap-3 transition-colors"
        >
          <Settings size={18} />
          Configurações
        </button>
        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="w-full px-4 py-2.5 text-left text-status-error hover:bg-surface-elevated flex items-center gap-3 transition-colors disabled:opacity-50"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </div>
  );
}
