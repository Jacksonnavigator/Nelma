export const formatCurrency = (amount: number, currency = "TZS"): string => {
  const formatted = new Intl.NumberFormat("en-TZ", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(amount);

  return currency + " " + formatted;
};

export const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-TZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

export const formatTime = (isoDate: string): string => {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(isoDate));
};

// "Today", "Yesterday", otherwise "Mon 22 Sep". Keys are local YYYY-MM-DD dates.
export const formatDayHeading = (dayKey: string, todayKey: string): { kind: "today" | "yesterday" | "date"; label: string } => {
  const day = new Date(dayKey + "T00:00:00");
  const yesterday = new Date(todayKey + "T00:00:00");
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey === todayKey) return { kind: "today", label: "Today" };
  if (day.getTime() === yesterday.getTime()) return { kind: "yesterday", label: "Yesterday" };
  return { kind: "date", label: new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(day) };
};

export const initialsFromName =(name: string): string => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "N";
};
