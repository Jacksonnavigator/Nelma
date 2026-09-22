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

export const initialsFromName = (name: string): string => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "N";
};
