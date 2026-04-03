import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function FilterableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  className = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    const option = options.find((opt) => opt.value === optionValue);
    if (option) {
      onChange(option.value);
      setSearch("");
      setIsOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`
          w-full px-3 py-2.5 rounded-input bg-surface-elevated border border-border text-text-primary
          flex items-center justify-between cursor-pointer transition-all
          ${isOpen ? "ring-2 ring-accent/30 border-accent" : ""}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={selectedOption ? "text-text-primary" : "text-text-muted"}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="Pesquisar..."
              className="w-full pl-9 pr-3 py-2.5 bg-surface-card border border-border-subtle rounded-t-input text-text-primary outline-none focus:border-accent"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto bg-surface-card border-x border-b border-border-subtle rounded-b-input shadow-float">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-3 text-sm text-text-muted text-center">
                Nenhum resultado
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    px-3 py-2.5 cursor-pointer transition-colors text-text-primary
                    hover:bg-surface-elevated
                    ${option.value === value ? "bg-accent/10 text-accent" : ""}
                  `}
                >
                  {option.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
