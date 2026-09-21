export type StatusTone = "live" | "scheduled" | "expired" | "paused" | "limit";

export type CodeStatus = { tone: StatusTone; label: string; detail: string };

type StatusInput = {
  active: boolean;
  expiresAt: string | Date | null;
  activeFrom: string | Date | null;
  maxScans: number | null;
  scanCount: number;
};

const asDate = (v: string | Date | null) => (v ? new Date(v) : null);

export function codeStatus(code: StatusInput, now = new Date()): CodeStatus {
  const expires = asDate(code.expiresAt);
  const starts = asDate(code.activeFrom);
  if (!code.active) return { tone: "paused", label: "Paused", detail: "Manually disabled" };
  if (starts && starts > now)
    return { tone: "scheduled", label: "Scheduled", detail: `Goes live ${formatDate(starts)}` };
  if (expires && expires <= now)
    return { tone: "expired", label: "Expired", detail: `Ended ${formatDate(expires)}` };
  if (code.maxScans !== null && code.scanCount >= code.maxScans)
    return { tone: "limit", label: "Limit reached", detail: `${code.scanCount}/${code.maxScans} scans` };
  if (expires) return { tone: "live", label: "Live", detail: `Expires ${formatRelative(expires, now)}` };
  return { tone: "live", label: "Live", detail: "No expiry" };
}

export function formatDate(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelative(target: Date, now = new Date()): string {
  const diff = target.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [1000 * 60 * 60 * 24 * 365, "year"],
    [1000 * 60 * 60 * 24 * 30, "month"],
    [1000 * 60 * 60 * 24, "day"],
    [1000 * 60 * 60, "hour"],
    [1000 * 60, "minute"],
  ];
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [ms, unit] of units) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return rtf.format(Math.round(diff / 1000), "second");
}

export const TONE_CLASSES: Record<StatusTone, string> = {
  live: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  scheduled: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
  expired: "bg-rose-400/15 text-rose-300 ring-rose-400/30",
  paused: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  limit: "bg-fuchsia-400/15 text-fuchsia-300 ring-fuchsia-400/30",
};
