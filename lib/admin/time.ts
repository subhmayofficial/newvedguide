const ADMIN_TIMEZONE = "Asia/Kolkata";

const ADMIN_DATETIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: ADMIN_TIMEZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

function toDate(input: string | Date): Date {
  return input instanceof Date ? input : new Date(input);
}

export function formatAdminDateTime(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = toDate(input);
  if (Number.isNaN(d.getTime())) return "—";
  return `${ADMIN_DATETIME_FORMATTER.format(d)} IST`;
}

export function startOfTodayIstIso(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ADMIN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";

  return new Date(`${year}-${month}-${day}T00:00:00+05:30`).toISOString();
}
