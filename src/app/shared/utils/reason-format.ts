export type ReasonAction = 'revoked' | 'rejected' | 'updated';

export interface ReasonFields {
  reasonText: string;
  action: ReasonAction;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Normalize revocation/rejection reason fields for display.
 * Prefers structured fields (updatedAt/updatedBy/action) and falls back to
 * parsing legacy "(action on <date> by <actor>)" suffixes when present.
 */
export function parseReasonFields(
  reason?: string | null,
  updatedAt?: string | null,
  updatedBy?: string | null,
  action?: ReasonAction,
): ReasonFields {
  const legacyMatch = reason?.match(/\((revoked|rejected) on (.+) by (.+)\)$/);
  const baseReason = legacyMatch
    ? reason?.replace(legacyMatch[0], '').trim()
    : reason?.trim() || '';

  const effectiveAction: ReasonAction =
    action ?? (legacyMatch?.[1] as ReasonAction) ?? 'updated';

  const actor = updatedBy || legacyMatch?.[3] || '';
  const isoTimestamp = updatedAt || legacyMatch?.[2];

  const reasonText =
    baseReason ||
    reason ||
    (effectiveAction === 'revoked'
      ? 'Revoked'
      : effectiveAction === 'rejected'
        ? 'Rejected'
        : '');

  return {
    reasonText,
    action: effectiveAction,
    updatedAt: isoTimestamp || undefined,
    updatedBy: actor || undefined,
  };
}
