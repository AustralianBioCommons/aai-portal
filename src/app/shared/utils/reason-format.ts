export type ReasonAction = "revoked" | "rejected" | "updated";

/**
 * Format a revocation/rejection reason into a human-friendly string.
 * Prefers structured fields (updatedAt/updatedBy/action) and falls back to
 * parsing legacy "(action on <date> by <actor>)" suffixes when present.
 */
export function formatReason(
  reason?: string | null,
  updatedAt?: string | null,
  updatedBy?: string | null,
  action?: ReasonAction,
): string {
  if (!reason && !updatedAt) {
    return "";
  }

  const legacyMatch = reason?.match(/\((revoked|rejected) on (.+) by (.+)\)$/);
  const baseReason = legacyMatch
    ? reason?.replace(legacyMatch[0], "").trim()
    : reason?.trim() || "";

  const effectiveAction: ReasonAction =
    action ?? (legacyMatch?.[1] as ReasonAction) ?? "updated";

  const actor = updatedBy || legacyMatch?.[3] || "(unknown)";
  const isoTimestamp = updatedAt || legacyMatch?.[2];

  const date = isoTimestamp ? new Date(isoTimestamp) : null;
  const formattedDate =
    date && !Number.isNaN(date.getTime())
      ? new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date)
      : isoTimestamp;

  if (!formattedDate) {
    return reason || "";
  }

  const prefix = baseReason ? `${baseReason} ` : "";
  return `${prefix}(${effectiveAction} on ${formattedDate} by ${actor})`;
}
