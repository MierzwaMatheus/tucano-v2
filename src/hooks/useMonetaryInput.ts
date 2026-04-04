import { useCallback, ChangeEvent } from "react";

/**
 * Hook to format monetary input as user types.
 * Automatically formats to BRL (X.XXX,XX)
 *
 * Behavior:
 * - Digits are added from right to left (cents -> reais)
 * - Ex: "15532" → "155,32"
 * - Cursor position is preserved during manual editing
 */
export function useMonetaryInput(
  value: string,
  onChange: (formattedValue: string, numericValue: string) => void,
): (event: ChangeEvent<HTMLInputElement>) => void {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      const selectionStart = event.target.selectionStart ?? 0;

      const rawDigits = inputValue.replace(/\D/g, "");

      if (rawDigits === "") {
        onChange("", "");
        return;
      }

      const numericValue = Number(rawDigits) / 100;

      const formatted = numericValue.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const newCursorPosition = calculateCursorPosition(
        inputValue,
        selectionStart,
        formatted,
      );

      onChange(formatted, numericValue.toString());

      setTimeout(() => {
        const target = event.target as HTMLInputElement;
        target.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    },
    [onChange],
  );

  return handleChange;
}

/**
 * Calculates new cursor position after formatting
 */
export function calculateCursorPosition(
  currentInput: string,
  cursorPosition: number,
  newFormatted: string,
): number {
  const digitCount = countDigits(currentInput);

  let digitCountBeforeCursor = 0;
  for (let i = 0; i < cursorPosition && i < currentInput.length; i++) {
    if (currentInput[i].match(/\d/)) {
      digitCountBeforeCursor++;
    }
  }

  if (cursorPosition >= currentInput.length || digitCountBeforeCursor === 0) {
    return newFormatted.length;
  }

  const digitsFromRight = digitCount - digitCountBeforeCursor;
  const charsFromEnd = calculateCharsFromEnd(newFormatted, digitsFromRight);

  return newFormatted.length - charsFromEnd;
}

export function countDigits(str: string): number {
  return (str.match(/\d/g) || []).length;
}

export function calculateCharsFromEnd(
  formatted: string,
  digitsFromRight: number,
): number {
  let digitCount = 0;
  let charCount = 0;

  for (let i = formatted.length - 1; i >= 0; i--) {
    charCount++;
    if (formatted[i].match(/\d/)) {
      digitCount++;
      if (digitCount === digitsFromRight) {
        if (i > 0 && !formatted[i - 1].match(/\d/)) {
          charCount++;
        }
        break;
      }
    }
  }

  return charCount;
}

/**
 * Formats a numeric value to BRL monetary format
 */
export function formatMonetaryValue(value: string): string {
  if (!value || value === "") return "";

  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return "";

  return numericValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
