import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { SignInForm } from "./SignInForm";
import { api } from "../convex/_generated/api";
import { UserMenu } from "./components/UserMenu";
import {
  Eye,
  ArrowLeftRight,
  Target,
  CreditCard,
  Tag,
  Settings,
  User,
} from "lucide-react";

type Tab = "finance" | "shopping" | "cards" | "categories" | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode; path: string }[] =
  [
    {
      id: "finance",
      label: "Visão",
      icon: <Eye size={20} />,
      path: "/finance",
    },
    {
      id: "shopping",
      label: "Compras",
      icon: <ArrowLeftRight size={20} />,
      path: "/shopping",
    },
    {
      id: "cards",
      label: "Cartões",
      icon: <CreditCard size={20} />,
      path: "/cards",
    },
    {
      id: "categories",
      label: "Categorias",
      icon: <Tag size={20} />,
      path: "/categories",
    },
    {
      id: "settings",
      label: "Ajustes",
      icon: <Settings size={20} />,
      path: "/settings",
    },
  ];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = useQuery(api.users.getCurrentUser);

  const currentTab = (location.pathname.slice(1) as Tab) || "finance";

  const handleTabChange = (path: string) => {
    navigate(path);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-page">
      <Unauthenticated>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-text-primary mb-2">
                Tucano Finanças
              </h1>
              <p className="text-text-secondary">
                Consciência financeira silenciosa
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <header className="sticky top-0 z-20 bg-surface-card border-b border-border-subtle shadow-card px-4 h-14 flex items-center justify-between">
          <h2 className="text-lg font-bold text-accent">Tucano</h2>
          <button
            onClick={toggleUserMenu}
            className="flex items-center gap-2 p-1.5 rounded-button hover:bg-surface-elevated transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center overflow-hidden">
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={18} className="text-text-muted" />
              )}
            </div>
            <span className="text-text-primary text-sm font-medium max-w-[120px] truncate">
              {user?.name || "Usuário"}
            </span>
          </button>
          {showUserMenu && <UserMenu onClose={() => setShowUserMenu(false)} />}
        </header>

        <main className="flex-1 pb-20">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-20 bg-surface-card border-t border-border-subtle shadow-card">
          <div className="flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.path)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  currentTab === t.id
                    ? "text-accent"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <span
                  className={
                    currentTab === t.id ? "text-accent" : "text-text-muted"
                  }
                >
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </Authenticated>
    </div>
  );
}
