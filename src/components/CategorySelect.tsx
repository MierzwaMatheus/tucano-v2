import { useState, useRef, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { CATEGORY_SELECT } from "../lib/ui-strings";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find((c) => c._id === value);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
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

  function handleSelect(categoryId: Id<"categories">) {
    console.log("[CategorySelect] Category selected, id:", categoryId);
    onChange(categoryId);
    setIsOpen(false);
    setSearchTerm("");
  }

  function handleClear() {
    console.log("[CategorySelect] Selection cleared");
    onChange(undefined);
    setSearchTerm("");
  }

  return (
    <div ref={containerRef} data-testid="category-select">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div
          className={`w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary cursor-pointer flex items-center justify-between gap-2 ${
            isOpen ? "border-accent" : ""
          }`}
          data-testid="category-select-trigger"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }}
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
            className="absolute z-50 w-full mt-1 bg-surface-card border border-border rounded-input shadow-card overflow-hidden"
            data-testid="category-select-dropdown"
          >
            <div className="p-2 border-b border-border-subtle">
              <input
                ref={inputRef}
                type="text"
                className="w-full px-3 py-2 rounded-input bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:border-accent outline-none text-sm"
                placeholder={CATEGORY_SELECT.SEARCH_PLACEHOLDER}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                data-testid="category-select-search"
              />
            </div>
            <ul
              className="max-h-60 overflow-auto"
              data-testid="category-select-list"
            >
              {filteredCategories.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-text-muted text-center">
                  {CATEGORY_SELECT.NO_RESULTS}
                </li>
              ) : (
                filteredCategories.map((category) => (
                  <li
                    key={category._id}
                    className={`px-3 py-2.5 cursor-pointer flex items-center gap-2 hover:bg-surface-elevated transition-colors ${
                      category._id === value ? "bg-accent-subtle" : ""
                    }`}
                    onClick={() => handleSelect(category._id)}
                    data-testid={`category-option-${category._id}`}
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
