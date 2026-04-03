import { useState } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { ShoppingPage } from "./pages/ShoppingPage";
import { FinancePage } from "./pages/FinancePage";
import { CardsPage } from "./pages/CardsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { ShoppingCart, BarChart2, CreditCard, Tag } from "lucide-react";

type Tab = "finance" | "shopping" | "cards" | "categories";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "finance", label: "Balanços", icon: <BarChart2 size={20} /> },
  { id: "shopping", label: "Compras", icon: <ShoppingCart size={20} /> },
  { id: "cards", label: "Cartões", icon: <CreditCard size={20} /> },
  { id: "categories", label: "Categorias", icon: <Tag size={20} /> },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("finance");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Unauthenticated>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-2">💰 Finança</h1>
              <p className="text-gray-500">Controle suas finanças e compras</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm px-4 h-14 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">💰 Finança</h2>
          <SignOutButton />
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20">
          {tab === "finance" && <FinancePage />}
          {tab === "shopping" && <ShoppingPage />}
          {tab === "cards" && <CardsPage />}
          {tab === "categories" && <CategoriesPage />}
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg">
          <div className="flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  tab === t.id ? "text-primary" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className={tab === t.id ? "text-primary" : "text-gray-400"}>
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
