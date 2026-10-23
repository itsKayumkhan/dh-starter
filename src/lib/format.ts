import { site } from "@/config/site";

type DateValue = Date | string | number;

function date(value: DateValue) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(
  value: DateValue,
  locale: string = site.locale,
  timeZone: string = site.timeZone,
) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone,
  }).format(date(value));
}

export function formatDateTime(
  value: DateValue,
  locale: string = site.locale,
  timeZone: string = site.timeZone,
) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date(value));
}

export function formatRelative(
  value: DateValue,
  reference: DateValue,
  locale: string = site.locale,
) {
  const seconds = Math.round(
    (date(value).getTime() - date(reference).getTime()) / 1000,
  );
  const absolute = Math.abs(seconds);
  const [amount, unit] =
    absolute < 60
      ? ([seconds, "second"] as const)
      : absolute < 3_600
        ? ([Math.round(seconds / 60), "minute"] as const)
        : absolute < 86_400
          ? ([Math.round(seconds / 3_600), "hour"] as const)
          : absolute < 604_800
            ? ([Math.round(seconds / 86_400), "day"] as const)
            : ([Math.round(seconds / 604_800), "week"] as const);
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    amount,
    unit,
  );
}

export function formatMoney(minorUnits: number, currency: string) {
  const formatter = new Intl.NumberFormat(site.locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(minorUnits / 10 ** digits);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(site.locale).format(value);
}

export function formatBytes(value: number) {
  const unit =
    value >= 1_073_741_824
      ? "GB"
      : value >= 1_048_576
        ? "MB"
        : value >= 1_024
          ? "KB"
          : "B";
  const divisor =
    unit === "GB"
      ? 1_073_741_824
      : unit === "MB"
        ? 1_048_576
        : unit === "KB"
          ? 1_024
          : 1;
  return `${new Intl.NumberFormat(site.locale, { maximumFractionDigits: unit === "B" ? 0 : 1 }).format(value / divisor)} ${unit}`;
}

export function formatMonth(
  value: DateValue,
  locale: string = site.locale,
  timeZone: string = site.timeZone,
) {
  return new Intl.DateTimeFormat(locale, { month: "short", timeZone }).format(
    date(value),
  );
}
