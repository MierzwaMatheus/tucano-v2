export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function getCompetence(purchaseDate: number, closingDay: number) {
  const date = new Date(purchaseDate);
  const day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  if (day >= closingDay) {
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return { competenceMonth: month, competenceYear: year };
}

export function formatMonthYear(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

export function prevMonth(month: number, year: number) {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

export function nextMonth(month: number, year: number) {
  if (month === 12) return { month: 1, year: year + 1 };
  return { month: month + 1, year };
}
