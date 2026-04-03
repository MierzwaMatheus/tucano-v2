export const toCents = (brl: number) => Math.round(brl * 100);
export const fromCents = (cents: number) => cents / 100;
export const formatBRL = (cents: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(fromCents(cents));

export const parseBRL = (value: string): number => {
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : toCents(parsed);
};
