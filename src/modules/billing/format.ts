export function formatMoney(amount: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amount / 10 ** digits);
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}
