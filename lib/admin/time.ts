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

/** Presets for inbox / session lists (activity by `updated_at` in IST). */
export type InboxDatePreset = "all" | "today" | "yesterday" | "7d" | "30d";

const MS_PER_DAY = 86_400_000;

/** Inclusive IST-day bounds for filtering `updated_at` timestamps. */
export function getInboxDatePresetBoundsMs(
  preset: InboxDatePreset,
  now: Date = new Date()
): { from: number; to: number } | null {
  if (preset === "all") return null;
  const todayStart = new Date(startOfTodayIstIso(now)).getTime();
  const endOfToday = todayStart + MS_PER_DAY - 1;
  const nowMs = now.getTime();

  switch (preset) {
    case "today":
      return { from: todayStart, to: Math.min(nowMs, endOfToday) };
    case "yesterday": {
      const yStart = todayStart - MS_PER_DAY;
      return { from: yStart, to: yStart + MS_PER_DAY - 1 };
    }
    case "7d":
      return { from: todayStart - 6 * MS_PER_DAY, to: Math.min(nowMs, endOfToday) };
    case "30d":
      return { from: todayStart - 29 * MS_PER_DAY, to: Math.min(nowMs, endOfToday) };
    default:
      return null;
  }
}

export function sessionUpdatedAtMatchesPreset(
  updatedAtIso: string,
  preset: InboxDatePreset,
  now?: Date
): boolean {
  const bounds = getInboxDatePresetBoundsMs(preset, now);
  if (!bounds) return true;
  const t = new Date(updatedAtIso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= bounds.from && t <= bounds.to;
}
