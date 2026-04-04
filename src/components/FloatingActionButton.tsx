import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { Modal } from "./Modal";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

const MOBILE_BREAKPOINT = 768;

interface FloatingActionButtonProps {
  onClick: () => void;
  ariaLabel: string;
  icon?: React.ReactNode;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  ariaLabel,
  icon,
  className = "",
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-accent text-surface-page shadow-float flex items-center justify-center hover:bg-accent-hover transition-all duration-200 hover:scale-105 active:scale-95 md:hidden ${className}`}
      type="button"
    >
      {icon ?? <Plus size={24} />}
    </button>
  );
}

interface ResponsiveModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
  isOpen: boolean;
}

export function ResponsiveModal({
  title,
  onClose,
  children,
  showCloseButton = true,
  isOpen,
}: ResponsiveModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);
    setIsMobile(!media.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(!e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <BottomSheetModal
        title={title}
        onClose={onClose}
        showCloseButton={showCloseButton}
      >
        {children}
      </BottomSheetModal>
    );
  }

  return (
    <Modal title={title} onClose={onClose}>
      {children}
    </Modal>
  );
}

interface BottomSheetModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export function BottomSheetModal({
  title,
  onClose,
  children,
  showCloseButton = true,
}: BottomSheetModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasFocused = useRef(false);

  useBodyScrollLock(true);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose],
  );

  const getFocusableElements = useCallback(() => {
    if (!contentRef.current) return [];
    const elements = contentRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    return Array.from(elements).filter((el) => !el.hasAttribute("disabled"));
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
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
    [handleClose, getFocusableElements],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    if (!hasFocused.current) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        setTimeout(() => {
          focusableElements[0].focus();
        }, 300);
        hasFocused.current = true;
      }
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, getFocusableElements]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center md:hidden transition-opacity duration-300 ${
        isVisible && !isClosing ? "opacity-100" : "opacity-0"
      }`}
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        className={`relative bg-surface-card rounded-t-card shadow-float w-full max-w-2xl max-h-[85vh] overflow-y-auto border-t border-border-subtle transform transition-transform duration-300 ease-out ${
          isVisible && !isClosing ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        <div className="pt-3 pb-2 flex items-center justify-center">
          <div className="w-10 h-1.5 bg-border-subtle rounded-full" />
        </div>

        <div className="sticky top-0 bg-surface-card border-b border-border-subtle px-5 py-3 flex items-center justify-between">
          <h2
            id="bottom-sheet-title"
            className="text-lg font-semibold text-text-primary"
          >
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="p-1.5 rounded-button hover:bg-surface-elevated transition-colors text-text-muted hover:text-text-secondary"
              aria-label="Fechar"
              type="button"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        <div ref={contentRef} className="p-5 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
