"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="px-4 py-2 rounded-button bg-surface-elevated text-text-secondary border border-border font-semibold hover:bg-surface-page hover:text-text-primary transition-colors shadow-card hover:shadow-hover"
      onClick={() => void signOut()}
    >
      Sair
    </button>
  );
}
