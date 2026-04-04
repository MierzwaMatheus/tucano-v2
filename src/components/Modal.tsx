import { X } from "lucide-react";
import { ReactNode, useEffect, useRef, useCallback } from "react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useBodyScrollLock(true);

  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    const elements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    return Array.from(elements).filter((el) => !el.hasAttribute("disabled"));
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [onClose, getFocusableElements],
  );

  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement;

    document.addEventListener("keydown", handleKeyDown);

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [handleKeyDown, getFocusableElements]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className="custom-scrollbar relative bg-surface-card rounded-card shadow-float w-full max-w-md max-h-[90vh] overflow-y-auto border border-border-subtle"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-text-primary"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-button hover:bg-surface-elevated transition-colors text-text-muted hover:text-text-secondary"
            aria-label="Fechar modal"
            type="button"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
