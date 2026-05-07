/** Minimum affordable chat time (seconds) required to enter waiting room / start live meter. */
export const MIN_CHAT_START_SECONDS = 5 * 60;

/** INR per minute → paise charged per minute (100 paise = ₹1). */
export function inrPerMinuteToPaisePerMinute(inrPerMin: number): number {
  return Math.max(1, Math.round(inrPerMin * 100));
}

/** Paise needed for `MIN_CHAT_START_SECONDS` at this rate (integer-safe, matches affordableChatSeconds). */
export function minWalletPaiseForChatStart(rateInrPerMin: number): number {
  const ppm = inrPerMinuteToPaisePerMinute(rateInrPerMin);
  return ppm * 5;
}

export function hasMinWalletForChatStart(
  balancePaise: number,
  rateInrPerMin: number
): boolean {
  return affordableChatSeconds(balancePaise, rateInrPerMin) >= MIN_CHAT_START_SECONDS;
}

/** DB/JSON sometimes returns wallet as string — normalise for comparisons. */
export function coerceWalletPaise(raw: unknown): number {
  if (raw == null) return 0;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

/**
 * Whole seconds of chat affordable at flat per-minute rate (no partial-minute rounding).
 * Formula: (balancePaise / paisePerMinute) * 60
 */
export function affordableChatSeconds(
  balancePaise: number,
  rateInrPerMin: number
): number {
  if (balancePaise <= 0 || rateInrPerMin <= 0) return 0;
  const ppm = inrPerMinuteToPaisePerMinute(rateInrPerMin);
  return Math.floor((balancePaise / ppm) * 60);
}

export function formatCountdownMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/**
 * Remaining chat seconds: min(time left from session budget, affordable from current wallet).
 * When anchor/budget are missing (legacy rows), uses wallet-only affordance.
 */
export function remainingChatSeconds(
  countdownStartedAtIso: string | null | undefined,
  countdownBudgetSeconds: number | null | undefined,
  balancePaise: number,
  rateInrPerMin: number,
  nowMs: number = Date.now()
): number {
  const fromWallet = affordableChatSeconds(balancePaise, rateInrPerMin);
  if (
    !countdownStartedAtIso ||
    countdownBudgetSeconds == null ||
    countdownBudgetSeconds <= 0
  ) {
    return fromWallet;
  }
  const elapsed = Math.max(
    0,
    Math.floor((nowMs - new Date(countdownStartedAtIso).getTime()) / 1000)
  );
  const fromAnchor = Math.max(0, countdownBudgetSeconds - elapsed);
  return Math.min(fromAnchor, fromWallet);
}

/** DB budget so remaining after sync matches affordableSeconds at `now`. */
export function countdownBudgetForWalletSync(
  affordableSeconds: number,
  elapsedSeconds: number
): number {
  return Math.max(0, affordableSeconds + elapsedSeconds);
}

/** Paise burned per second at this per-minute rate (integer math matches meter API). */
export function paiseBurnedInInterval(
  elapsedSeconds: number,
  rateInrPerMin: number
): number {
  if (elapsedSeconds <= 0 || rateInrPerMin <= 0) return 0;
  const ppm = inrPerMinuteToPaisePerMinute(rateInrPerMin);
  return Math.floor((elapsedSeconds * ppm) / 60);
}

/**
 * Remaining seconds assuming wallet balance in DB is authoritative and undeducted
 * usage since `lastBilledAtIso` accrues at the per-minute rate (same formula as meter).
 * Keeps user + admin displays aligned when they use the same balance + last_billed_at.
 */
/** Approximate chat seconds represented by a total paise charge at `rateInrPerMin`. */
export function estimatedSecondsFromBilledPaise(
  totalPaise: number,
  rateInrPerMin: number
): number {
  if (totalPaise <= 0 || rateInrPerMin <= 0) return 0;
  const ppm = inrPerMinuteToPaisePerMinute(rateInrPerMin);
  return Math.floor((totalPaise / ppm) * 60);
}

export function remainingSecondsFromMeterAccrual(
  walletBalancePaise: number,
  rateInrPerMin: number,
  lastBilledAtIso: string,
  nowMs: number = Date.now()
): number {
  if (walletBalancePaise <= 0 || rateInrPerMin <= 0) return 0;
  const ppm = inrPerMinuteToPaisePerMinute(rateInrPerMin);
  const last = new Date(lastBilledAtIso).getTime();
  if (Number.isNaN(last)) return affordableChatSeconds(walletBalancePaise, rateInrPerMin);
  const deltaSec = Math.max(0, (nowMs - last) / 1000);
  const accrued = Math.floor((deltaSec * ppm) / 60);
  const eff = Math.max(0, walletBalancePaise - accrued);
  return Math.floor((eff / ppm) * 60);
}
