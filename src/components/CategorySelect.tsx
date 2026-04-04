import { useState, useRef, useEffect, useMemo } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { CATEGORY_SELECT } from "../lib/ui-strings";
import { useDropdownPosition } from "../hooks/useDropdownPosition";

interface Category {
  _id: Id<"categories">;
  name: string;
  color?: string;
  icon?: string;
}

interface Props {
  categories: Category[];
  value?: Id<"categories">;
  onChange: (id: Id<"categories"> | undefined) => void;
  placeholder?: string;
  label?: string;
}

export function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = CATEGORY_SELECT.PLACEHOLDER,
  label,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const { position: dropdownPosition, triggerRef } = useDropdownPosition({
    dropdownHeight: 300,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === value),
    [categories, value],
  );

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [categories, searchTerm],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  function handleSelect(categoryId: Id<"categories">) {
    const category = categories.find((c) => c._id === categoryId);
    console.log(
      `[CategorySelect] Categoria selecionada: "${category?.name ?? "desconhecido"}" (id: ${categoryId})`,
    );
    onChange(categoryId);
    setIsOpen(false);
    setSearchTerm("");
  }

  function handleClear() {
    console.log("[CategorySelect] Seleção limpa");
    onChange(undefined);
    setSearchTerm("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCategories.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCategories[highlightedIndex]) {
          handleSelect(filteredCategories[highlightedIndex]._id);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm("");
        break;
      case "Tab":
        setIsOpen(false);
        setSearchTerm("");
        break;
    }
  }

  return (
    <div ref={containerRef} data-testid="category-select">
      {label && (
        <label
          id="category-select-label"
          className="block text-sm font-medium text-text-secondary mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative" ref={triggerRef}>
        <div
          className={`w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary cursor-pointer flex items-center justify-between gap-2 ${
            isOpen ? "border-accent" : ""
          }`}
          data-testid="category-select-trigger"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={label ? "category-select-label" : undefined}
          aria-controls={isOpen ? "category-listbox" : undefined}
          aria-activedescendant={
            isOpen && filteredCategories[highlightedIndex]
              ? `category-option-${filteredCategories[highlightedIndex]._id}`
              : undefined
          }
          tabIndex={0}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedCategory ? (
              <>
                {selectedCategory.icon && (
                  <span className="text-base flex-shrink-0">
                    {selectedCategory.icon}
                  </span>
                )}
                {selectedCategory.color && (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                )}
                <span className="truncate">{selectedCategory.name}</span>
              </>
            ) : (
              <span className="text-text-muted truncate">{placeholder}</span>
            )}
          </div>
          {selectedCategory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-text-muted hover:text-text-secondary flex-shrink-0"
              aria-label="Limpar seleção"
              type="button"
            >
              {CATEGORY_SELECT.CLEAR_BUTTON}
            </button>
          )}
          {!selectedCategory && (
            <svg
              className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>

        {isOpen && (
          <div
            className={`absolute z-[60] w-full bg-surface-card border border-border rounded-input shadow-card overflow-hidden ${
              dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
            }`}
            data-testid="category-select-dropdown"
          >
            <div className="p-2 border-b border-border-subtle">
              <input
                ref={inputRef}
                type="text"
                className="w-full px-3 py-2 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none text-sm"
                placeholder={CATEGORY_SELECT.SEARCH_PLACEHOLDER}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                data-testid="category-select-search"
                aria-label="Buscar categoria"
              />
            </div>
            <ul
              ref={listRef}
              id="category-listbox"
              className="max-h-60 overflow-auto"
              role="listbox"
              data-testid="category-select-list"
            >
              {filteredCategories.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-text-muted text-center">
                  {CATEGORY_SELECT.NO_RESULTS}
                </li>
              ) : (
                filteredCategories.map((category, index) => (
                  <li
                    key={category._id}
                    id={`category-option-${category._id}`}
                    className={`px-3 py-2.5 cursor-pointer flex items-center gap-2 hover:bg-surface-elevated transition-colors ${
                      category._id === value ? "bg-accent-subtle" : ""
                    } ${index === highlightedIndex ? "bg-surface-elevated" : ""}`}
                    onClick={() => handleSelect(category._id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    data-testid={`category-option-${category._id}`}
                    role="option"
                    aria-selected={category._id === value}
                  >
                    {category.icon && (
                      <span className="text-base flex-shrink-0">
                        {category.icon}
                      </span>
                    )}
                    {category.color && (
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <span className="truncate">{category.name}</span>
                    {category._id === value && (
                      <svg
                        className="w-4 h-4 text-accent flex-shrink-0 ml-auto"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
