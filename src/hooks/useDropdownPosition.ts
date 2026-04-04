import { useState, useEffect, useCallback, useRef } from "react";

interface UseDropdownPositionOptions {
  dropdownHeight?: number;
}

interface UseDropdownPositionReturn {
  position: "top" | "bottom";
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

export function useDropdownPosition(
  options: UseDropdownPositionOptions = {},
): UseDropdownPositionReturn {
  const { dropdownHeight = 280 } = options;
  const [position, setPosition] = useState<"top" | "bottom">("bottom");
  const triggerRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      setPosition("top");
    } else {
      setPosition("bottom");
    }
  }, [dropdownHeight]);

  useEffect(() => {
    calculatePosition();

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculatePosition, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [calculatePosition]);

  return { position, triggerRef };
}
