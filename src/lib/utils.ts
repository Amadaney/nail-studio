export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
export const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const waLink = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

// "09:00:00" -> "9:00 AM"
export function fmtTime(t: string) {
  const [h = "0", m = "0"] = t.split(":");
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" })
    .format(new Date(Date.UTC(2024, 0, 1, Number(h), Number(m))));
}

// "2026-11-10" -> "Tuesday, November 10" (locale-aware)
export function fmtDate(date: string, locale: string, style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat(locale, {
    weekday: style, month: style, day: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
