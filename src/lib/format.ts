export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export function inrCompact(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  return inr(n);
}

/** "14:30" -> "2:30 PM" */
export function to12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export const shortDay = new Intl.DateTimeFormat("en-IN", { weekday: "short" });
export const shortDate = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });
export const longDate = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" });

export const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");
